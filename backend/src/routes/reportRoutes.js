const express = require("express");
const {
  memberReport,
  houseReport,
  investmentReport,
  employmentReport,
  donationReport,
  analyticsReport
} = require("../controllers/reportController");
const { protect } = require("../middlewares/authMiddleware"); 
const authorize = require("../middlewares/roleMiddleware"); 

const router = express.Router();

/*
|--------------------------------------------------------------------------
| SECURE EXPORT COMPILATION REPOSITORY LAYERS
|--------------------------------------------------------------------------
*/

// Onboarding and Demographic Reports (SuperAdmin & MembershipAdmin)
router.get("/members/pdf", protect, authorize("SuperAdmin", "MembershipAdmin"), memberReport);
router.get("/houses/pdf", protect, authorize("SuperAdmin", "MembershipAdmin"), houseReport);

// Core Wealth and Operational Enterprise Reports (SuperAdmin & BusinessAdmin)
router.get("/investments/pdf", protect, authorize("SuperAdmin", "BusinessAdmin"), investmentReport);
router.get("/employment/pdf", protect, authorize("SuperAdmin", "BusinessAdmin"), employmentReport);

// Humanitarian Aid and Charity Funding Reports (SuperAdmin & DonationAdmin)
router.get("/donations/pdf", protect, authorize("SuperAdmin", "DonationAdmin"), donationReport);

// FIXED LAYERS: Master Treasury & Global Summary Matrix Reports
// Maps both route paths explicitly to handle incoming client download triggers cleanly
router.get("/analytics/pdf", protect, authorize("SuperAdmin", "BusinessAdmin"), analyticsReport);
router.get("/treasury/pdf", protect, authorize("SuperAdmin", "BusinessAdmin"), analyticsReport);

module.exports = router;
