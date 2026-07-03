const Permission = require("../models/Permission");
const { createAuditLog } = require("./auditLogController");

const createPermission = async (req, res) => {
  try {
    const { name, module, description } = req.body;

    if (!name || !module) {
      return res.status(400).json({
        success: false,
        message: "Permission name and module are required fields"
      });
    }

    // 1. FIXED LAYER: Case-insensitive duplicate check using a regex pattern match
    const existing = await Permission.findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This permission name has already been registered in the system access matrix"
      });
    }

    const permission = await Permission.create({
      name: name.trim(),
      module: module.trim(),
      description
    });

    // 2. Commit system permission alteration block to the security ledger
    await createAuditLog({
      userId: req.user?._id,
      module: "Permissions & Authorization",
      action: "System Permission Created",
      oldValue: "None",
      newValue: JSON.stringify({ permissionId: permission._id, name: permission.name, module: permission.module }),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(201).json({
      success: true,
      message: "System clearance authorization key generated successfully",
      permission
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ module: 1, name: 1 });

    return res.status(200).json({
      success: true,
      count: permissions.length,
      permissions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createPermission,
  getPermissions
};
