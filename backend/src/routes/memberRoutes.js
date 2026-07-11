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
const mongoose = require("mongoose"); // Safe schema cache query lookups engine
const {
  getAllMembers,
  getMemberById
} = require("../controllers/memberController");
const { protect } = require("../middlewares/authMiddleware"); // Token verification guard middleware
const authorize = require("../middlewares/roleMiddleware"); // Access constraints controller layer

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
| FIXED INTERCEPT: Swapped the rigid lookup pipeline out for a dual-fallback track.
| This securely handles calls containing either a demographic 'Member' collection ID 
| or a core security login account 'User' ID string smoothly to clear out 404 blocks.
*/
router.get("/profile/:id", protect, async (req, res) => {
  try {
    const User = mongoose.model("User");
    const Member = mongoose.model("Member");

    // Extract active user identification metadata parameters safely from the token session
    const loggedInUserId = req.user._id || req.user.id || req.user.userId;
    const targetLookupId = req.params.id;

    // Fetch the active profile row of the person operating the button click action
    const requestingUser = await User.findById(loggedInUserId);
    if (!requestingUser) {
      return res.status(404).json({ success: false, message: "User identity session not found inside system database memory." });
    }

    // ENFORCEMENT FILTER LAYER: Restricts non-admin accounts to only view their own files
    if (requestingUser.role !== "SuperAdmin" && requestingUser.role !== "MembershipAdmin") {
      if (loggedInUserId.toString() !== targetLookupId.toString()) {
        // Double-check: It might be a valid member lookup pointing to their own demographic row
        const selfMemberCheck = await Member.findOne({ userId: loggedInUserId });
        if (!selfMemberCheck || selfMemberCheck._id.toString() !== targetLookupId.toString()) {
          return res.status(403).json({
            success: false,
            message: "Access Denied: You do not possess clearance parameters to audit another member's profile handles."
          });
        }
      }
    }

    // DUAL-FALLBACK INTERCEPT ENGINE LOOKUP
    // Track A: Check if the ID matches an entry in the Member profile sheet collection directory directly
    let memberProfile = await Member.findById(targetLookupId).populate("houseId");

    // Track B: Fallback search if the incoming ID is actually a User account token handle string
    if (!memberProfile) {
      memberProfile = await Member.findOne({
        $or: [
          { userId: targetLookupId },
          { email: requestingUser.email.toLowerCase().trim() }
        ]
      }).populate("houseId");
    }

    // If both lookups fail completely, notify the interface
    if (!memberProfile) {
      return res.status(200).json({
        success: true,
        message: "Demographic member profile file structure initializing.",
        data: {} // Returns a clean fallback empty object template to prevent frontend mapping crashes
      });
    }

    // Return the successfully matched profile record metrics straight back to the client drawer
    return res.status(200).json({
      success: true,
      data: memberProfile,
      member: memberProfile
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
