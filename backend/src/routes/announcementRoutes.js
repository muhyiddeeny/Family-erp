// const express = require("express");
// const {
//   createAnnouncement,
//   getAnnouncements,
//   deactivateAnnouncement // <-- FIXED LAYER: Import the missing deactivation controller function
// } = require("../controllers/announcementController");
// const { protect } = require("../middlewares/authMiddleware");
// const authorize = require("../middlewares/roleMiddleware");

// const router = express.Router();

// /*
// |--------------------------------------------------------------------------
// | CREATE BULLETIN BROADCAST
// |--------------------------------------------------------------------------
// | Open to SuperAdmin and all specialized administrative team levels.
// */
// router.post(
//   "/",
//   protect,
//   authorize("SuperAdmin", "MembershipAdmin", "BusinessAdmin", "DonationAdmin", "HouseAdmin"),
//   createAnnouncement
// );

// /*
// |--------------------------------------------------------------------------
// | FETCH ACTIVE BULLETINS
// |--------------------------------------------------------------------------
// | Accessible to any valid logged-in account (including basic family members)
// */
// router.get("/", protect, getAnnouncements);

// /*
// |--------------------------------------------------------------------------
// | DEACTIVATE BULLETIN (FIXED LAYER: Restored missing administrative endpoint)
// |--------------------------------------------------------------------------
// */
// router.patch("/:id/deactivate", protect, authorize("SuperAdmin", "MembershipAdmin", "BusinessAdmin", "DonationAdmin", "HouseAdmin"), deactivateAnnouncement);

// module.exports = router;
const express = require("express");
const mongoose = require("mongoose"); // Safe database model lookup engine
const { protect } = require("../middlewares/authMiddleware"); // Token validation guard
const authorize = require("../middlewares/roleMiddleware"); // Clearance level guard

const router = express.Router();

/*
|--------------------------------------------------------------------------
| FIXED LAYER: BROADCAST SYSTEM NOTIFICATION CREATION VECTOR
|--------------------------------------------------------------------------
| Resolves the 500 error and the missing 'message' path validation crash.
| It intercepts the frontend's payload and maps 'content' over to 'message'
| safely right before writing to MongoDB.
*/
router.post("/", protect, authorize("SuperAdmin", "MembershipAdmin"), async (req, res) => {
  try {
    const Announcement = mongoose.model("Announcement");
    const { title, content, message } = req.body;

    if (!title || (!content && !message)) {
      return res.status(400).json({
        success: false,
        message: "Validation Error: Notification title and message parameters are required."
      });
    }

    // FIXED ALIGNMENT CODES: Maps frontend 'content' cleanly into the schema's required 'message' field
    const announcement = await Announcement.create({
      title: title.trim(),
      message: (message || content).trim(),
      createdAt: new Date()
    });

    return res.status(201).json({
      success: true,
      message: "Broadcast notification published across member platforms successfully!",
      announcement
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/*
|--------------------------------------------------------------------------
| GLOBAL FEED & NOTICE REMOVAL ENDPOINTS
|--------------------------------------------------------------------------
*/

// GET ALL: Fetches live notices for the announcement stream feed boards
router.get("/", protect, async (req, res) => {
  try {
    const Announcement = mongoose.model("Announcement");
    const notices = await Announcement.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notices.length,
      announcements: notices,
      data: notices // Safe fallback key array tracking
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE NOTICE: Purges broadcast records completely from database context maps
router.delete("/:id", protect, authorize("SuperAdmin", "MembershipAdmin"), async (req, res) => {
  try {
    const Announcement = mongoose.model("Announcement");
    const deletedNotice = await Announcement.findByIdAndDelete(req.params.id);

    if (!deletedNotice) {
      return res.status(404).json({ success: false, message: "Target announcement post thread not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Announcement dropped and removed from live system feeds successfully."
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
