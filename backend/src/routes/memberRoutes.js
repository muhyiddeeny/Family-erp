// const express = require("express");
// const mongoose = require("mongoose"); // Safe schema cache query lookups engine
// const {
//   getAllMembers,
//   getMemberById
// } = require("../controllers/memberController");
// const { protect } = require("../middlewares/authMiddleware"); // Token verification guard middleware
// const authorize = require("../middlewares/roleMiddleware"); // Access constraints controller layer

// const router = express.Router();

// /*
// |--------------------------------------------------------------------------
// | FIXED LAYER: ACTIVE SUB-ADMINS DIRECTORY ROSTER FEED
// |--------------------------------------------------------------------------
// | Resolves the 404 Not Found error by catching the System Control panel's 
// | fetch request. It queries your User collection for all staff roles.
// */
// router.get("/admin/list", protect, authorize("SuperAdmin"), async (req, res) => {
//   try {
//     const User = mongoose.model("User");

//     // Pull all users holding administrative system roles, excluding regular Members
//     const subAdmins = await User.find({
//       role: { $in: ["MembershipAdmin", "BusinessAdmin", "DonationAdmin", "HouseAdmin", "Admin"] }
//     }).select("-passwordHash").sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       count: subAdmins.length,
//       admins: subAdmins
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | PROTECTED MEMBER REGISTRY DIRECTORY (SuperAdmin & MembershipAdmin Only)
// |--------------------------------------------------------------------------
// | Safeguards private personal histories, location metrics, and phone 
// | parameters from regular users and external crawlers alike.
// */
// router.get("/", protect, authorize("SuperAdmin", "MembershipAdmin"), getAllMembers);

// // Maps variation tracks to handle administrative user lookup triggers cleanly
// router.get("/:id", protect, authorize("SuperAdmin", "MembershipAdmin"), getMemberById);

// /*
// |--------------------------------------------------------------------------
// | FIXED LAYER: REDIRECT PROFILE SUB-PATH VIEW LINK WITH SELF-LOOKUP GUARD
// |--------------------------------------------------------------------------
// */
// router.get("/profile/:id", protect, async (req, res) => {
//   try {
//     const User = mongoose.model("User");
//     const Member = mongoose.model("Member");

//     // Extract active user identification metadata parameters safely from the token session
//     const loggedInUserId = req.user._id || req.user.id || req.user.userId;
//     const targetLookupId = req.params.id;

//     // Fetch the active profile row of the person operating the button click action
//     const requestingUser = await User.findById(loggedInUserId);
//     if (!requestingUser) {
//       return res.status(404).json({ success: false, message: "User identity session not found inside system database memory." });
//     }

//     // ENFORCEMENT FILTER LAYER: Restricts non-admin accounts to only view their own files
//     if (requestingUser.role !== "SuperAdmin" && requestingUser.role !== "MembershipAdmin") {
//       if (loggedInUserId.toString() !== targetLookupId.toString()) {
//         // Double-check: It might be a valid member lookup pointing to their own demographic row
//         const selfMemberCheck = await Member.findOne({ userId: loggedInUserId });
//         if (!selfMemberCheck || selfMemberCheck._id.toString() !== targetLookupId.toString()) {
//           return res.status(403).json({
//             success: false,
//             message: "Access Denied: You do not possess clearance parameters to audit another member's profile handles."
//           });
//         }
//       }
//     }

//     // DUAL-FALLBACK INTERCEPT ENGINE LOOKUP
//     // Track A: Check if the ID matches an entry in the Member profile sheet collection directory directly
//     let memberProfile = await Member.findById(targetLookupId).populate("houseId");

//     // Track B: Fallback search if the incoming ID is actually a User account token handle string
//     if (!memberProfile) {
//       memberProfile = await Member.findOne({
//         $or: [
//           { userId: targetLookupId },
//           { email: requestingUser.email.toLowerCase().trim() }
//         ]
//       }).populate("houseId");
//     }

//     // If both lookups fail completely, notify the interface
//     if (!memberProfile) {
//       return res.status(200).json({
//         success: true,
//         message: "Demographic member profile file structure initializing.",
//         data: {} // Returns a clean fallback empty object template to prevent frontend mapping crashes
//       });
//     }

//     // Return the successfully matched profile record metrics straight back to the client drawer
//     return res.status(200).json({
//       success: true,
//       data: memberProfile,
//       member: memberProfile
//     });

//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// });

// module.exports = router;
const express = require("express");
const mongoose = require("mongoose"); 
const {
  getAllMembers,
  getMemberById
} = require("../controllers/memberController");
const { protect } = require("../middlewares/authMiddleware"); 
const authorize = require("../middlewares/roleMiddleware"); 

const router = express.Router();

/*
|--------------------------------------------------------------------------
| FIXED LAYER: ACTIVE SUB-ADMINS DIRECTORY ROSTER FEED
|--------------------------------------------------------------------------
*/
router.get("/admin/list", protect, authorize("SuperAdmin"), async (req, res) => {
  try {
    const User = mongoose.model("User");
    const subAdmins = await User.find({
      role: { $in: ["MembershipAdmin", "BusinessAdmin", "DonationAdmin", "HouseAdmin", "Admin"] }
    }).select("-passwordHash").sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: subAdmins.length, admins: subAdmins });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/*
|--------------------------------------------------------------------------
| PROTECTED MEMBER REGISTRY DIRECTORY (SuperAdmin & MembershipAdmin Only)
|--------------------------------------------------------------------------
*/
router.get("/", protect, authorize("SuperAdmin", "MembershipAdmin"), getAllMembers);

/*
|--------------------------------------------------------------------------
| NEW DIRECTORY CONTROLS: ADMINISTRATIVE MEMBER MANIPULATION
|--------------------------------------------------------------------------
*/

// UPDATE MEMBER INFO (SuperAdmin & MembershipAdmin)
router.put("/:id", protect, authorize("SuperAdmin", "MembershipAdmin"), async (req, res) => {
  try {
    const Member = mongoose.model("Member");
    const User = mongoose.model("User");

    const updatedMember = await Member.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("houseId").populate("house");

    if (!updatedMember) {
      return res.status(404).json({ success: false, message: "Member profile not found." });
    }

    // Sync baseline changes over to core User account login table if linked
    if (updatedMember.userId) {
      await User.findByIdAndUpdate(updatedMember.userId, {
        $set: {
          firstName: req.body.firstName || updatedMember.firstName,
          surname: req.body.surname || updatedMember.surname
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Member updated successfully in active matrix.",
      member: updatedMember
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PURGE MEMBER ENTRIES (SuperAdmin & MembershipAdmin)
router.delete("/:id", protect, authorize("SuperAdmin", "MembershipAdmin"), async (req, res) => {
  try {
    const Member = mongoose.model("Member");
    const User = mongoose.model("User");

    const memberToDelete = await Member.findById(req.params.id);
    if (!memberToDelete) {
      return res.status(404).json({ success: false, message: "Member account target profile data not found." });
    }

    // Wipe out the demographic database row, the login account document, and matching references
    await Promise.all([
      Member.findByIdAndDelete(req.params.id),
      User.deleteOne({ _id: memberToDelete.userId }),
      User.deleteOne({ email: memberToDelete.email.toLowerCase().trim() })
    ]);

    return res.status(200).json({
      success: true,
      message: "Member identity record and login credentials successfully purged from system storage."
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Maps variation tracks to handle administrative user lookup triggers cleanly
router.get("/:id", protect, authorize("SuperAdmin", "MembershipAdmin"), getMemberById);

/*
|--------------------------------------------------------------------------
| FIXED LAYER: REDIRECT PROFILE SUB-PATH VIEW LINK WITH SELF-LOOKUP GUARD
|--------------------------------------------------------------------------
*/
router.get("/profile/:id", protect, async (req, res) => {
  try {
    const User = mongoose.model("User");
    const Member = mongoose.model("Member");

    const loggedInUserId = req.user._id || req.user.id || req.user.userId;
    const targetLookupId = req.params.id;

    const requestingUser = await User.findById(loggedInUserId);
    if (!requestingUser) {
      return res.status(404).json({ success: false, message: "User identity session not found inside system database memory." });
    }

    if (requestingUser.role !== "SuperAdmin" && requestingUser.role !== "MembershipAdmin") {
      if (loggedInUserId.toString() !== targetLookupId.toString()) {
        const selfMemberCheck = await Member.findOne({ userId: loggedInUserId });
        if (!selfMemberCheck || selfMemberCheck._id.toString() !== targetLookupId.toString()) {
          return res.status(403).json({ success: false, message: "Access Denied: You do not possess clearance parameters to audit another member's profile handles." });
        }
      }
    }

    let memberProfile = await Member.findById(targetLookupId).populate("houseId");

    if (!memberProfile) {
      memberProfile = await Member.findOne({ $or: [ { userId: targetLookupId }, { email: requestingUser.email.toLowerCase().trim() } ] }).populate("houseId");
    }

    if (!memberProfile) {
      return res.status(200).json({ success: true, message: "Demographic member profile file structure initializing.", data: {} });
    }

    return res.status(200).json({ success: true, data: memberProfile, member: memberProfile });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
