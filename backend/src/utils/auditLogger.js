const AuditLog = require(
  "../models/AuditLog"
);

const createAuditLog = async ({
  userId = null,
  module,
  action,
  oldValue = null,
  newValue = null,
  ipAddress = ""
}) => {
  try {
    await AuditLog.create({
      userId,
      module,
      action,
      oldValue,
      newValue,
      ipAddress
    });
  } catch (error) {
    console.error(
      "Audit Log Error:",
      error.message
    );
  }
};

module.exports = createAuditLog;