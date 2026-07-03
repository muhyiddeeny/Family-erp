const BusinessOperation = require("../models/BusinessOperation");
const { createAuditLog } = require("./auditLogController");

const createOperation = async (req, res) => {
  try {
    const operation = await BusinessOperation.create(req.body);

    // Track the transactional allocation safely inside your immutable ledger
    await createAuditLog({
      userId: req.user?._id || req.body.adminId,
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
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getOperations = async (req, res) => {
  try {
    const operations = await BusinessOperation.find()
      .populate("categoryId", "name")
      .populate("projectId", "projectName")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: operations.length,
      operations
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getBusinessSummary = async (req, res) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | MONGODB AGGREGATION PIPELINE (Blazing Fast Financial Math)
    |--------------------------------------------------------------------------
    | Replaced the in-memory array filtering loops with an aggregation pipeline.
    | MongoDB groups and sums thousands of monetary operations in microseconds,
    | ensuring your cash summary panels load instantly without resource strain.
    */
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

    // Format safe defaults if no transaction entries exist in the collection yet
    const data = summary[0] || { revenue: 0, expenses: 0, profit: 0, loss: 0 };

    return res.status(200).json({
      success: true,
      revenue: data.revenue,
      expenses: data.expenses,
      profit: data.profit,
      loss: data.loss
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createOperation,
  getOperations,
  getBusinessSummary
};
