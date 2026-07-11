// const express = require("express");
// const {
//   getAllMembers,
//   getMemberById,
//   getAllSubAdmins,
//   updateSubAdmin,
//   deleteSubAdmin
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
// router.get("/:id", protect, authorize("SuperAdmin", "MembershipAdmin"), getMemberById);

// /*
// |--------------------------------------------------------------------------
// | SUB-ADMIN CONSOLE MANAGEMENT CONTROL (SuperAdmin Only Privileges)
// |--------------------------------------------------------------------------
// | Provides explicit, unrestricted directory visibility to pull, update, or 
// | delete sub-administrative system operational account profiles.
// */
// router.get("/admin/list", protect, authorize("SuperAdmin"), getAllSubAdmins);
// router.put("/admin/:id", protect, authorize("SuperAdmin"), updateSubAdmin);
// router.delete("/admin/:id", protect, authorize("SuperAdmin"), deleteSubAdmin);

// module.exports = router;

const express = require("express");
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

// FIXED LAYERS: Maps both variation tracks to handle user lookup triggers cleanly
router.get("/:id", protect, authorize("SuperAdmin", "MembershipAdmin"), getMemberById);

/*
|--------------------------------------------------------------------------
| FIXED LAYER: REDIRECT PROFILE SUB-PATH VIEW LINK
|--------------------------------------------------------------------------
| Resolves the 404 Not Found error explicitly by catching the frontend's
| profile lookups and routing them directly to your member data controller.
*/
router.get("/profile/:id", protect, authorize("SuperAdmin", "MembershipAdmin"), getMemberById);

module.exports = router;
