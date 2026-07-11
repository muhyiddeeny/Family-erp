// const express = require("express");
// const {
//   getAllMembers,
//   getMemberById
// } = require("../controllers/memberController");
// const { protect } = require("../middlewares/authMiddleware"); // Import token validation guard
// const authorize = require("../middlewares/roleMiddleware"); // Import access constraint controller

// const router = express.Router();

// /*
// |--------------------------------------------------------------------------
// | PROTECTED MEMBER REGISTRY DIRECTORY (SuperAdmin & MembershipAdmin Only)
// |--------------------------------------------------------------------------
// | Safeguards private personal histories, location metrics, and phone 
// | parameters from regular users and external crawlers alike.
// */
// router.get("/", protect, authorize("SuperAdmin", "MembershipAdmin"), getAllMembers);

// // FIXED LAYERS: Maps both variation tracks to handle user lookup triggers cleanly
// router.get("/:id", protect, authorize("SuperAdmin", "MembershipAdmin"), getMemberById);

// /*
// |--------------------------------------------------------------------------
// | FIXED LAYER: REDIRECT PROFILE SUB-PATH VIEW LINK
// |--------------------------------------------------------------------------
// | Resolves the 404 Not Found error explicitly by catching the frontend's
// | profile lookups and routing them directly to your member data controller.
// */
// router.get("/profile/:id", protect, authorize("SuperAdmin", "MembershipAdmin"), getMemberById);

// module.exports = router;

const express = require("express");
const mongoose = require("mongoose"); // FIXED LAYER: Load mongoose for safe schema cache queries
const {
  getAllMembers,
  getMemberById
} = require("../controllers/memberController");
const { protect } = require("../middlewares/authMiddleware"); // Import token validation guard
const authorize = require("../middlewares/roleMiddleware"); // Import access constraint controller

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PROTECTED MEMBER REGISTRY DIRECTORY (SuperAdmin & MembershipAdmin Only)
|--------------------------------------------------------------------------
| Safeguards private personal histories, location metrics, and phone 
| parameters from regular users and external crawlers alike.
*/
router.get("/", protect, authorize("SuperAdmin", "MembershipAdmin"), getAllMembers);

// Maps variation tracks to handle administrative user lookup triggers cleanly
router.get("/:id", protect, authorize("SuperAdmin", "MembershipAdmin"), getMemberById);

/*
|--------------------------------------------------------------------------
| FIXED LAYER: REDIRECT PROFILE SUB-PATH VIEW LINK WITH SELF-LOOKUP GUARD
|--------------------------------------------------------------------------
| FIXED INTERCEPT: Removed the rigid administrative authorize restriction array.
| This allows standard logged-in Members to pull their own profile cards safely.
| If a standard user tries to peek at someone else's profile ID, it throws an error.
*/
router.get("/profile/:id", protect, async (req, res) => {
  try {
    const User = mongoose.model("User");

    // Extract active user ID from token session parameters
    const loggedInUserId = req.user._id || req.user.id || req.user.userId;
    const targetLookupId = req.params.id;

    // Fetch the active profile of the person making the call
    const requestingUser = await User.findById(loggedInUserId);
    if (!requestingUser) {
      return res.status(404).json({ success: false, message: "User session not found inside database registry." });
    }

    // ENFORCEMENT FILTER LAYER: If not an admin, they are strictly blocked from loading other people's data matrices
    if (requestingUser.role !== "SuperAdmin" && requestingUser.role !== "MembershipAdmin") {
      if (loggedInUserId.toString() !== targetLookupId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access Denied: You do not possess clearance parameters to audit another member's profile."
        });
      }
    }

    // If validations clear out successfully, hand the request downstream to your original controller logic
    return getMemberById(req, res);

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
