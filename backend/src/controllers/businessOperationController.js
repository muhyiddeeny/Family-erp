const mongoose = require("mongoose");
const BusinessOperation = require("../models/BusinessOperation");
const { createAuditLog } = require("./auditLogController");
const { RefError, resolveCategoryAndProject } = require("../utils/businessRefs");

const OPERATION_TYPES = ["Revenue", "Expense", "Profit", "Loss"];

const parseAmount = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const sendError = (res, error) => {
  if (error instanceof RefError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error("Business operation error:", error);
  return res.status(500).json({ success: false, message: error.message });
};

/*
|--------------------------------------------------------------------------
| CREATE A REVENUE / EXPENSE / PROFIT / LOSS RECORD
|--------------------------------------------------------------------------
*/
const createOperation = async (req, res) => {
  try {
    const { operationType, amount, description, operationDate } = req.body;

    if (!OPERATION_TYPES.includes(operationType)) {
      return res.status(400).json({ success: false, message: "Record type must be Revenue, Expense, Profit or Loss." });
    }

    const parsedAmount = parseAmount(amount);
    if (parsedAmount === null) {
      return res.status(400).json({ success: false, message: "Amount must be a number greater than zero." });
    }

    const refs = await resolveCategoryAndProject(req.body);

    const date = operationDate ? new Date(operationDate) : new Date();
    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ success: false, message: "The date is not valid." });
    }

    const operation = await BusinessOperation.create({
      ...refs,
      operationType,
      amount: parsedAmount,
      description: String(description || "").trim(),
      operationDate: date,
      createdBy: req.user?._id || null
    });

    await createAuditLog({
      userId: req.user?._id,
      module: "Business Operations",
      action: `Transaction Logged: ${operation.operationType}`,
      oldValue: "None",
      newValue: JSON.stringify({
        id: operation._id,
        type: operation.operationType,
        amount: operation.amount,
        projectId: operation.projectId
      }),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(201).json({
      success: true,
      message: "Business operational ledger transaction logged successfully",
      operation
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/*
|--------------------------------------------------------------------------
| LIST ALL RECORDS (newest first)
|--------------------------------------------------------------------------
*/
const getOperations = async (req, res) => {
  try {
    const operations = await BusinessOperation.find()
      .populate("categoryId", "name")
      .populate("projectId", "projectName")
      .populate("createdBy", "username email")
      .sort({ operationDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: operations.length,
      operations
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/*
|--------------------------------------------------------------------------
| TOTALS: revenue, expenses, profit, loss
|--------------------------------------------------------------------------
*/
const getBusinessSummary = async (req, res) => {
  try {
    const summary = await BusinessOperation.aggregate([
      {
        $group: {
          _id: null,
          revenue: { $sum: { $cond: [{ $eq: ["$operationType", "Revenue"] }, "$amount", 0] } },
          expenses: { $sum: { $cond: [{ $eq: ["$operationType", "Expense"] }, "$amount", 0] } },
          profit: { $sum: { $cond: [{ $eq: ["$operationType", "Profit"] }, "$amount", 0] } },
          loss: { $sum: { $cond: [{ $eq: ["$operationType", "Loss"] }, "$amount", 0] } }
        }
      }
    ]);

    const data = summary[0] || { revenue: 0, expenses: 0, profit: 0, loss: 0 };

    return res.status(200).json({
      success: true,
      revenue: data.revenue,
      expenses: data.expenses,
      profit: data.profit,
      loss: data.loss
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/*
|--------------------------------------------------------------------------
| EDIT A RECORD
|--------------------------------------------------------------------------
*/
const updateOperation = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid record id." });
    }

    const existing = await BusinessOperation.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Record not found." });
    }

    const before = {
      type: existing.operationType,
      amount: existing.amount,
      projectId: existing.projectId
    };

    if (req.body.operationType !== undefined) {
      if (!OPERATION_TYPES.includes(req.body.operationType)) {
        return res.status(400).json({ success: false, message: "Record type must be Revenue, Expense, Profit or Loss." });
      }
      existing.operationType = req.body.operationType;
    }

    if (req.body.amount !== undefined) {
      const parsedAmount = parseAmount(req.body.amount);
      if (parsedAmount === null) {
        return res.status(400).json({ success: false, message: "Amount must be a number greater than zero." });
      }
      existing.amount = parsedAmount;
    }

    if (req.body.description !== undefined) {
      existing.description = String(req.body.description || "").trim();
    }

    if (req.body.operationDate !== undefined) {
      const date = new Date(req.body.operationDate);
      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({ success: false, message: "The date is not valid." });
      }
      existing.operationDate = date;
    }

    const refs = await resolveCategoryAndProject({
      categoryId: req.body.categoryId ?? existing.categoryId,
      projectId: req.body.projectId ?? existing.projectId
    });
    existing.categoryId = refs.categoryId;
    existing.projectId = refs.projectId;

    await existing.save();

    await createAuditLog({
      userId: req.user?._id,
      module: "Business Operations",
      action: `Transaction Edited: ${existing.operationType}`,
      oldValue: JSON.stringify(before),
      newValue: JSON.stringify({
        type: existing.operationType,
        amount: existing.amount,
        projectId: existing.projectId
      }),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({ success: true, message: "Record updated successfully.", operation: existing });
  } catch (error) {
    return sendError(res, error);
  }
};

/*
|--------------------------------------------------------------------------
| DELETE A RECORD
|--------------------------------------------------------------------------
*/
const deleteOperation = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid record id." });
    }

    const operation = await BusinessOperation.findByIdAndDelete(req.params.id);
    if (!operation) {
      return res.status(404).json({ success: false, message: "Record not found." });
    }

    await createAuditLog({
      userId: req.user?._id,
      module: "Business Operations",
      action: `Transaction Deleted: ${operation.operationType}`,
      oldValue: JSON.stringify({
        id: operation._id,
        type: operation.operationType,
        amount: operation.amount,
        projectId: operation.projectId
      }),
      newValue: "Deleted",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({ success: true, message: "Record deleted successfully." });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  createOperation,
  getOperations,
  getBusinessSummary,
  updateOperation,
  deleteOperation
};
