const AuditLog = require("../models/AuditLog");

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("userId", "username email role firstName surname")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const createAuditLog = async ({
  userId = null,
  module,
  action,
  oldValue = null,
  newValue = null,
  ipAddress = "",
  userAgent = ""
}) => {
  try {
    // Safely structure values into database records
    await AuditLog.create({
      userId,
      module,
      action,
      oldValue: typeof oldValue === "object" ? JSON.stringify(oldValue) : oldValue,
      newValue: typeof newValue === "object" ? JSON.stringify(newValue) : newValue,
      ipAddress,
      userAgent
    });
  } catch (error) {
    console.error("Audit Log System Error Intercepted:", error.message);
  }
};

module.exports = {
  getAuditLogs,
  createAuditLog
};
