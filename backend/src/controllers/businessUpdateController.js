const BusinessUpdate = require("../models/BusinessUpdate");
const { createAuditLog } = require("./auditLogController");

const createUpdate = async (req, res) => {
  try {
    // FIXED LAYER: Explicitly map the logged-in administrator ID as the author
    const update = await BusinessUpdate.create({
      ...req.body,
      createdBy: req.user?._id || req.body.adminId
    });

    // Capture the broadcast event in the security ledger trail
    await createAuditLog({
      userId: req.user?._id || req.body.adminId,
      module: "Business Operations",
      action: "Project Update Broadcasted",
      oldValue: "None",
      newValue: JSON.stringify({
        updateId: update._id,
        title: update.title || "Untitled Update",
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
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getUpdates = async (req, res) => {
  try {
    const updates = await BusinessUpdate.find()
      .populate("categoryId", "name")
      .populate("projectId", "projectName")
      .populate("createdBy", "username email firstName surname") // Populates the author information profile safely
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: updates.length,
      updates
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createUpdate,
  getUpdates
};
