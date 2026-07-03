const Notification = require("../models/Notification");

const createNotification = async (req, res) => {
  try {
    const { memberId, title, message, type } = req.body;

    const notification = await Notification.create({
      memberId,
      title,
      message,
      type,
      isRead: false // Explicit default baseline initialization state
    });

    return res.status(201).json({
      success: true,
      notification
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getMemberNotifications = async (req, res) => {
  try {
    // SECURITY FIX: Fallback directly to the verified token ID to prevent cross-account profile peering leaks
    const authenticatedUserId = req.user?.userId || req.user?._id || req.params.memberId;

    // 1. Fetch only the most recent 50 alert objects to prevent massive client-side payload lag
    const notifications = await Notification.find({ memberId: authenticatedUserId })
      .sort({ createdAt: -1 })
      .limit(50);

    // 2. FIXED PERFORMANCE LAYER: Let MongoDB compute the unread tally blazingly fast in the DB layer
    const unreadCount = await Notification.countDocuments({
      memberId: authenticatedUserId,
      isRead: false
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const authenticatedUserId = req.user?.userId || req.user?._id;

    // Build query conditions safely to verify ownership before applying modification updates
    const queryConditions = { _id: req.params.id };
    if (req.user?.role !== "Admin" && req.user?.role !== "SuperAdmin") {
      queryConditions.memberId = authenticatedUserId;
    }

    const notification = await Notification.findOneAndUpdate(
      queryConditions,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification file not found or unauthorized clearance request"
      });
    }

    return res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const authenticatedUserId = req.user?.userId || req.user?._id || req.params.memberId;

    await Notification.updateMany(
      { memberId: authenticatedUserId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return res.status(200).json({
      success: true,
      message: "All pending profile alerts successfully cleared"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createNotification,
  getMemberNotifications,
  markAsRead,
  markAllAsRead
};
