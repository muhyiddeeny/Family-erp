const express = require("express");
const {
  memberReport,
  houseReport,
  investmentReport,
  employmentReport,
  donationReport,
  analyticsReport
} = require("../controllers/reportController");
const { protect } = require("../middlewares/authMiddleware"); // Import your security protection middleware
const authorize = require("../middlewares/roleMiddleware"); // Import your role checking middleware

const router = express.Router();

/*
|--------------------------------------------------------------------------
| SECURE EXPORT COMPILATION REPOSITORY LAYERS
|--------------------------------------------------------------------------
| Enforcing token protection shields sensitive asset listings and private family matrices.
| Restricting execution privileges to specific managers blocks server resource attacks.
*/

// Onboarding and Demographic Reports (SuperAdmin & MembershipAdmin)
router.get("/members/pdf", protect, authorize("SuperAdmin", "MembershipAdmin"), memberReport);
router.get("/houses/pdf", protect, authorize("SuperAdmin", "MembershipAdmin"), houseReport);

// Core Wealth and Operational Enterprise Reports (SuperAdmin & BusinessAdmin)
router.get("/investments/pdf", protect, authorize("SuperAdmin", "BusinessAdmin"), investmentReport);
router.get("/employment/pdf", protect, authorize("SuperAdmin", "BusinessAdmin"), employmentReport);

// Humanitarian Aid and Charity Funding Reports (SuperAdmin & DonationAdmin)
router.get("/donations/pdf", protect, authorize("SuperAdmin", "DonationAdmin"), donationReport);

// Master Platform Global Summary Matrix Reports (Strictly SuperAdmin Only)
router.get("/analytics/pdf", protect, authorize("SuperAdmin"), analyticsReport);

module.exports = router;
