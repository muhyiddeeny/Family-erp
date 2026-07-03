const express = require("express");
const {
  submitApplication,
  getApplications,
  getApplicationById
} = require("../controllers/employmentApplicationController");
const {
  approveApplication,
  rejectApplication
} = require("../controllers/employmentReviewController");

const { protect } = require("../middlewares/authMiddleware"); // Import session token verifier
const authorize = require("../middlewares/roleMiddleware"); // Import privilege controller guard

const router = express.Router();

/*
|--------------------------------------------------------------------------
| MEMBER APPLICATIONS LAYER (All Authenticated Members)
|--------------------------------------------------------------------------
*/
router.post("/", protect, submitApplication); // Regular logged-in users can apply safely

/*
|--------------------------------------------------------------------------
| HR ADMINISTRATIVE RECRUITMENT MANAGEMENT (SuperAdmin & BusinessAdmin Only)
|--------------------------------------------------------------------------
| Screening profiles, pulling personal logs, and approving operation jobs
| is strictly restricted to authorized administrative workflows.
*/
router.get("/", protect, authorize("SuperAdmin", "BusinessAdmin"), getApplications);
router.get("/:id", protect, authorize("SuperAdmin", "BusinessAdmin"), getApplicationById);
router.patch("/:id/approve", protect, authorize("SuperAdmin", "BusinessAdmin"), approveApplication);
router.patch("/:id/reject", protect, authorize("SuperAdmin", "BusinessAdmin"), rejectApplication);

module.exports = router;
