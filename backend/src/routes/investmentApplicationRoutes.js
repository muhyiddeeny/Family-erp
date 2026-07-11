// const express = require("express");
// const mongoose = require("mongoose"); // FIXED LAYER: Load mongoose for safe cache collection lookups
// const {
//   submitApplication,
//   getApplications
// } = require("../controllers/investmentApplicationController");
// const { protect } = require("../middlewares/authMiddleware"); 
// const authorize = require("../middlewares/roleMiddleware"); 

// const router = express.Router();

// /*
// |--------------------------------------------------------------------------
// | FIXED LAYER: PERSONAL PORTFOLIO HISTORICAL RECORD GRID FEED
// |--------------------------------------------------------------------------
// | Resolves the 404 Not Found error explicitly by catching the frontend fetch 
// | request. It looks up all investment records matching the logged-in user's email.
// */
// router.get("/my-portfolio", protect, async (req, res) => {
//   try {
//     // Dynamically retrieve the loaded collections from mongoose cache memory
//     const InvestmentApplication = mongoose.model("InvestmentApplication");
//     const User = mongoose.model("User");

//     // Extract user token handles directly from the protect middleware session
//     const targetUserId = req.user._id || req.user.id || req.user.userId;

//     const userProfile = await User.findById(targetUserId);
//     if (!userProfile) {
//       return res.status(404).json({ success: false, message: "User account session profile not found." });
//     }

//     // Grab all historical logs filed under this user's identity email or user ID reference
//     const history = await InvestmentApplication.find({ 
//       $or: [
//         { email: userProfile.email.toLowerCase().trim() },
//         { userId: userProfile._id }
//       ]
//     }).sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       history
//     });

//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | PORTFOLIO SUBMISSION LAYER (All Authenticated Members)
// |--------------------------------------------------------------------------
// */
// router.post("/apply", protect, submitApplication); // Added /apply subpath alias to align with frontend API.post hooks
// router.post("/", protect, submitApplication);

// /*
// |--------------------------------------------------------------------------
// | AUDITING EXPLORATION (SuperAdmin & BusinessAdmin Only)
// |--------------------------------------------------------------------------
// */
// router.get("/", protect, authorize("SuperAdmin", "BusinessAdmin"), getApplications);

// module.exports = router;
const express = require("express");
const mongoose = require("mongoose");
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
*/
router.get("/my-portfolio", protect, async (req, res) => {
  try {
    const InvestmentApplication = mongoose.model("InvestmentApplication");
    const User = mongoose.model("User");

    const targetUserId = req.user._id || req.user.id || req.user.userId;
    const userProfile = await User.findById(targetUserId);
    if (!userProfile) {
      return res.status(404).json({ success: false, message: "User account session profile not found." });
    }

    const history = await InvestmentApplication.find({ 
      $or: [
        { email: userProfile.email.toLowerCase().trim() },
        { userId: userProfile._id }
      ]
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, history });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/*
|--------------------------------------------------------------------------
| DYNAMIC DATA RETRIEVAL BRIDGE (All Authenticated Members / Admins)
|--------------------------------------------------------------------------
| FIXED INTERCEPT: Swapped the strict authorize block for an internal filter.
| If a standard Member calls this base endpoint, they only receive their own records.
| If a SuperAdmin or BusinessAdmin calls it, they receive the full global ledger.
*/
router.get("/", protect, async (req, res) => {
  try {
    const InvestmentApplication = mongoose.model("InvestmentApplication");
    const User = mongoose.model("User");

    const targetUserId = req.user._id || req.user.id || req.user.userId;
    const userProfile = await User.findById(targetUserId);
    if (!userProfile) {
      return res.status(404).json({ success: false, message: "User session profile not found." });
    }

    // Role Enforcement Conditional Routing Logic
    if (userProfile.role === "SuperAdmin" || userProfile.role === "BusinessAdmin") {
      // Admins pull the full global ledger directory
      const allApplications = await InvestmentApplication.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: allApplications.length, projects: allApplications, applications: allApplications });
    } else {
      // Standard members are strictly confined to their own rows
      const memberApplications = await InvestmentApplication.find({
        $or: [
          { email: userProfile.email.toLowerCase().trim() },
          { userId: userProfile._id }
        ]
      }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: memberApplications.length, projects: memberApplications, applications: memberApplications });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/*
|--------------------------------------------------------------------------
| PORTFOLIO SUBMISSION LAYER (All Authenticated Members)
|--------------------------------------------------------------------------
*/
router.post("/apply", protect, submitApplication);
router.post("/", protect, submitApplication);

module.exports = router;
