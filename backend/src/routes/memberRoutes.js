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
router.get("/:id", protect, authorize("SuperAdmin", "MembershipAdmin"), getMemberById);

module.exports = router;
