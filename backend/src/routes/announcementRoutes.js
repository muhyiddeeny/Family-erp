const express = require("express");
const {
  createAnnouncement,
  getAnnouncements,
  deactivateAnnouncement // <-- FIXED LAYER: Import the missing deactivation controller function
} = require("../controllers/announcementController");
const { protect } = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| CREATE BULLETIN BROADCAST
|--------------------------------------------------------------------------
| Open to SuperAdmin and all specialized administrative team levels.
*/
router.post(
  "/",
  protect,
  authorize("SuperAdmin", "MembershipAdmin", "BusinessAdmin", "DonationAdmin", "HouseAdmin"),
  createAnnouncement
);

/*
|--------------------------------------------------------------------------
| FETCH ACTIVE BULLETINS
|--------------------------------------------------------------------------
| Accessible to any valid logged-in account (including basic family members)
*/
router.get("/", protect, getAnnouncements);

/*
|--------------------------------------------------------------------------
| DEACTIVATE BULLETIN (FIXED LAYER: Restored missing administrative endpoint)
|--------------------------------------------------------------------------
*/
router.patch("/:id/deactivate", protect, authorize("SuperAdmin", "MembershipAdmin", "BusinessAdmin", "DonationAdmin", "HouseAdmin"), deactivateAnnouncement);

module.exports = router;
