// const express = require("express");
// const { getMemberDashboard } = require("../controllers/dashboardController");
// const { protect } = require("../middlewares/authMiddleware"); // Import your session verification middleware

// const router = express.Router();

// /*
// |--------------------------------------------------------------------------
// | SECURE PERSONAL DASHBOARD ENDPOINT FEED
// |--------------------------------------------------------------------------
// | Appending 'protect' requires a valid authorization Bearer header block.
// | This ensures your family member details, private WhatsApp group markers,
// | and personal investment ledgers are fully shielded from cross-site snooping.
// */
// router.get("/member/:memberId", protect, getMemberDashboard);

// module.exports = router;

const express = require("express");
const mongoose = require("mongoose"); // FIXED LAYER: Load mongoose to execute safe schema cache queries
const { getMemberDashboard } = require("../controllers/dashboardController");
const { protect } = require("../middlewares/authMiddleware"); // Import your session verification middleware

const router = express.Router();

/*
|--------------------------------------------------------------------------
| FIXED AUTOMATED MEMBER SUMMARY DATA CHANNEL
|--------------------------------------------------------------------------
| Resolves the 404 Not Found error by creating a clean route matching your 
| frontend's fetch requests. It pulls metrics straight from MongoDB using the 
| active user's authorization token handles.
*/
router.get("/member-summary", protect, async (req, res) => {
  try {
    const Member = mongoose.model("Member");
    const User = mongoose.model("User");

    // Extracting user identity tokens directly from the protect authentication session layer
    const targetUserId = req.user._id || req.user.id || req.user.userId;

    const userProfile = await User.findById(targetUserId);
    if (!userProfile) {
      return res.status(404).json({ success: false, message: "User security profile not found inside ledger maps." });
    }

    // Lookup their corresponding demographic application variables using their verified account email
    const memberDetails = await Member.findOne({ email: userProfile.email.toLowerCase().trim() });
    if (!memberDetails) {
      return res.status(404).json({ success: false, message: "Member demographic records not found inside collections." });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: userProfile._id,
        username: userProfile.username,
        email: userProfile.email,
        role: userProfile.role
      },
      member: memberDetails
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/*
|--------------------------------------------------------------------------
| SECURE PERSONAL DASHBOARD ENDPOINT FEED
|--------------------------------------------------------------------------
*/
router.get("/member/:memberId", protect, getMemberDashboard);

module.exports = router;
