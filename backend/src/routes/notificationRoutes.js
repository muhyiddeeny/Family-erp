const express = require("express");
const {
  createNotification,
  getMemberNotifications,
  markAsRead,
  markAllAsRead
} = require("../controllers/notificationController");
const { protect } = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| BROADCAST SYSTEM NOTIFICATION
|--------------------------------------------------------------------------
| Accessible to SuperAdmin and all specialized administrative team levels.
*/
router.post(
  "/",
  protect,
  authorize("SuperAdmin", "MembershipAdmin", "BusinessAdmin", "DonationAdmin", "HouseAdmin"),
  createNotification
);

/*
|--------------------------------------------------------------------------
| PERSONAL PROFILE NOTIFICATIONS (All Authenticated Members)
|--------------------------------------------------------------------------
*/
router.get("/member/:memberId", protect, getMemberNotifications);
router.patch("/:id/read", protect, markAsRead);
router.patch("/member/:memberId/read-all", protect, markAllAsRead);

module.exports = router;
