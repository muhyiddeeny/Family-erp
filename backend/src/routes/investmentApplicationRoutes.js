// const express = require("express");
// const {
//   submitApplication,
//   getApplications
// } = require("../controllers/investmentApplicationController");
// const { protect } = require("../middlewares/authMiddleware"); // Import your security protection middleware
// const authorize = require("../middlewares/roleMiddleware"); // Import your role checking middleware

// const router = express.Router();

// /*
// |--------------------------------------------------------------------------
// | PORTFOLIO SUBMISSION LAYER (All Authenticated Members)
// |--------------------------------------------------------------------------
// | Appending 'protect' ensures regular family members can initialize investment 
// | applications safely from their respective member dashboards.
// */
// router.post("/", protect, submitApplication);

// /*
// |--------------------------------------------------------------------------
// | AUDITING EXPLORATION (SuperAdmin & BusinessAdmin Only)
// |--------------------------------------------------------------------------
// | Viewing the global ledger portfolio submission list is highly restricted 
// | to authorized financial management channels.
// */
// router.get("/", protect, authorize("SuperAdmin", "BusinessAdmin"), getApplications);

// module.exports = router;
const express = require("express");
const mongoose = require("mongoose"); // FIXED LAYER: Load mongoose for safe cache collection lookups
const {
  submitApplication,
  getApplications
} = require("../controllers/investmentApplicationController");
const { protect } = require("../middlewares/authMiddleware"); 
const authorize = require("../middlewares/roleMiddleware"); 

const router = express.Router();

/*
|--------------------------------------------------------------------------
| FIXED LAYER: PERSONAL PORTFOLIO HISTORICAL RECORD GRID FEED
|--------------------------------------------------------------------------
| Resolves the 404 Not Found error explicitly by catching the frontend fetch 
| request. It looks up all investment records matching the logged-in user's email.
*/
router.get("/my-portfolio", protect, async (req, res) => {
  try {
    // Dynamically retrieve the loaded collections from mongoose cache memory
    const InvestmentApplication = mongoose.model("InvestmentApplication");
    const User = mongoose.model("User");

    // Extract user token handles directly from the protect middleware session
    const targetUserId = req.user._id || req.user.id || req.user.userId;

    const userProfile = await User.findById(targetUserId);
    if (!userProfile) {
      return res.status(404).json({ success: false, message: "User account session profile not found." });
    }

    // Grab all historical logs filed under this user's identity email or user ID reference
    const history = await InvestmentApplication.find({ 
      $or: [
        { email: userProfile.email.toLowerCase().trim() },
        { userId: userProfile._id }
      ]
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      history
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/*
|--------------------------------------------------------------------------
| PORTFOLIO SUBMISSION LAYER (All Authenticated Members)
|--------------------------------------------------------------------------
*/
router.post("/apply", protect, submitApplication); // Added /apply subpath alias to align with frontend API.post hooks
router.post("/", protect, submitApplication);

/*
|--------------------------------------------------------------------------
| AUDITING EXPLORATION (SuperAdmin & BusinessAdmin Only)
|--------------------------------------------------------------------------
*/
router.get("/", protect, authorize("SuperAdmin", "BusinessAdmin"), getApplications);

module.exports = router;
