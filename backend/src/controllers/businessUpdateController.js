const mongoose = require("mongoose");
const BusinessUpdate = require("../models/BusinessUpdate");
const { createAuditLog } = require("./auditLogController");
const { RefError, resolveCategoryAndProject } = require("../utils/businessRefs");

const sendError = (res, error) => {
  if (error instanceof RefError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error("Business update error:", error);
  return res.status(500).json({ success: false, message: error.message });
};

/*
|--------------------------------------------------------------------------
| PUBLISH A BUSINESS UPDATE (belongs to a category and a project)
|--------------------------------------------------------------------------
*/
const createUpdate = async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const updateDetails = String(req.body.updateDetails || "").trim();

    if (!title || !updateDetails) {
      return res.status(400).json({ success: false, message: "Both a title and the update details are required." });
    }

    const refs = await resolveCategoryAndProject(req.body);

    const update = await BusinessUpdate.create({
      ...refs,
      title,
      updateDetails,
      createdBy: req.user?._id
    });

    await createAuditLog({
      userId: req.user?._id,
      module: "Business Operations",
      action: "Project Update Broadcasted",
      oldValue: "None",
      newValue: JSON.stringify({
        updateId: update._id,
        title: update.title,
        projectId: update.projectId
      }),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(201).json({
      success: true,
      message: "Business operation update published successfully",
      update
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/*
|--------------------------------------------------------------------------
| LIST ALL UPDATES (newest first)
|--------------------------------------------------------------------------
*/
const getUpdates = async (req, res) => {
  try {
    const updates = await BusinessUpdate.find()
      .populate("categoryId", "name")
      .populate("projectId", "projectName")
      .populate("createdBy", "username email firstName surname")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: updates.length,
      updates
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/*
|--------------------------------------------------------------------------
| EDIT AN UPDATE
|--------------------------------------------------------------------------
*/
const updateUpdate = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid update id." });
    }

    const existing = await BusinessUpdate.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Update not found." });
    }

    const oldTitle = existing.title;

    if (req.body.title !== undefined) {
      const title = String(req.body.title || "").trim();
      if (!title) return res.status(400).json({ success: false, message: "The title cannot be empty." });
      existing.title = title;
    }

    if (req.body.updateDetails !== undefined) {
      const details = String(req.body.updateDetails || "").trim();
      if (!details) return res.status(400).json({ success: false, message: "The update details cannot be empty." });
      existing.updateDetails = details;
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
      action: "Project Update Edited",
      oldValue: oldTitle,
      newValue: existing.title,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({ success: true, message: "Update changed successfully.", update: existing });
  } catch (error) {
    return sendError(res, error);
  }
};

/*
|--------------------------------------------------------------------------
| DELETE AN UPDATE
|--------------------------------------------------------------------------
*/
const deleteUpdate = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid update id." });
    }

    const update = await BusinessUpdate.findByIdAndDelete(req.params.id);
    if (!update) {
      return res.status(404).json({ success: false, message: "Update not found." });
    }

    await createAuditLog({
      userId: req.user?._id,
      module: "Business Operations",
      action: "Project Update Deleted",
      oldValue: update.title,
      newValue: "Deleted",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({ success: true, message: "Update deleted successfully." });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  createUpdate,
  getUpdates,
  updateUpdate,
  deleteUpdate
};
