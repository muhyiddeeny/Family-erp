const express = require("express");
const router = express.Router();
const {
  submitApplication,
  getAllApplications,
  getApplicationById,
  approveApplication,
  rejectApplication
} = require("../controllers/membershipApplicationController");

// Import the middlewares safely
const { protect } = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware"); // Uses direct assignment import

// 1. PUBLIC ENDPOINT (No protection needed)
router.post("/submit", submitApplication);

/*
|--------------------------------------------------------------------------
| SECURE ADMINISTRATIVE ENDPOINTS
|--------------------------------------------------------------------------
| Bundling protect and authorize safely to satisfy Express function arrays.
*/
router.get("/all", protect, authorize("SuperAdmin", "MembershipAdmin"), getAllApplications);
router.get("/:id", protect, authorize("SuperAdmin", "MembershipAdmin"), getApplicationById);
router.post("/:id/approve", protect, authorize("SuperAdmin", "MembershipAdmin"), approveApplication);
router.post("/:id/reject", protect, authorize("SuperAdmin", "MembershipAdmin"), rejectApplication);

module.exports = router;
