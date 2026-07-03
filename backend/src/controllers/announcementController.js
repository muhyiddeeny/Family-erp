const Announcement = require("../models/Announcement");
const { createAuditLog } = require("./auditLogController"); // <-- Import your audit log layer helper

const createAnnouncement = async (req, res) => {
  try {
    const { title, message } = req.body;

    const announcement = await Announcement.create({
      title,
      message,
      isActive: true, // FIXED LAYER: Explicitly enforce 'true' state upon block initialization
      createdBy: req.user?._id || req.body.adminId // Safe fallback routing key reference
    });

    // Capture the creation event safely inside your system audit trails ledger
    await createAuditLog({
      userId: req.user?._id || req.body.adminId,
      module: "Communication",
      action: "Announcement Created",
      oldValue: "None",
      newValue: JSON.stringify({ title: announcement.title, id: announcement._id }),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(201).json({
      success: true,
      message: "System broadcast bulletin created successfully.",
      announcement
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true })
      .populate("createdBy", "username email firstName surname") // Populates profile fields safely
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: announcements.length,
      announcements
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const deactivateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement notice block file not found"
      });
    }

    // Capture deactivation event
    await createAuditLog({
      userId: req.user?._id,
      module: "Communication",
      action: "Announcement Deactivated",
      oldValue: "Active",
      newValue: "Inactive",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    return res.status(200).json({
      success: true,
      message: "Announcement successfully taken down from active bulletins.",
      announcement
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncements,
  deactivateAnnouncement
};
