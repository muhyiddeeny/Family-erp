// const express = require("express");
// const {
//   memberReport,
//   houseReport,
//   investmentReport,
//   employmentReport,
//   donationReport,
//   analyticsReport
// } = require("../controllers/reportController");
// const { protect } = require("../middlewares/authMiddleware"); 
// const authorize = require("../middlewares/roleMiddleware"); 

// const router = express.Router();

// /*
// |--------------------------------------------------------------------------
// | SECURE EXPORT COMPILATION REPOSITORY LAYERS
// |--------------------------------------------------------------------------
// */

// // Onboarding and Demographic Reports (SuperAdmin & MembershipAdmin)
// router.get("/members/pdf", protect, authorize("SuperAdmin", "MembershipAdmin"), memberReport);
// router.get("/houses/pdf", protect, authorize("SuperAdmin", "MembershipAdmin"), houseReport);

// // Core Wealth and Operational Enterprise Reports (SuperAdmin & BusinessAdmin)
// router.get("/investments/pdf", protect, authorize("SuperAdmin", "BusinessAdmin"), investmentReport);
// router.get("/employment/pdf", protect, authorize("SuperAdmin", "BusinessAdmin"), employmentReport);

// // Humanitarian Aid and Charity Funding Reports (SuperAdmin & DonationAdmin)
// router.get("/donations/pdf", protect, authorize("SuperAdmin", "DonationAdmin"), donationReport);

// // FIXED LAYERS: Master Treasury & Global Summary Matrix Reports
// // Maps both route paths explicitly to handle incoming client download triggers cleanly
// router.get("/analytics/pdf", protect, authorize("SuperAdmin", "BusinessAdmin"), analyticsReport);
// router.get("/treasury/pdf", protect, authorize("SuperAdmin", "BusinessAdmin"), analyticsReport);

// module.exports = router;

const express = require("express");
const mongoose = require("mongoose"); // FIXED LAYER: Load mongoose for safe database queries lookups
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
| FIXED LAYER: BUSINESS & EXECUTIVE OPERATION REPORTS SUMMARY FEED
|--------------------------------------------------------------------------
| Resolves the 404 Not Found error explicitly by catching your frontend's 
| summary query. It pulls counting statistics straight from your corporate tables.
*/
router.get("/business-reports", protect, authorize("SuperAdmin", "BusinessAdmin"), async (req, res) => {
  try {
    // Dynamically retrieve the loaded schema models from cache memory safely
    const InvestmentProject = mongoose.model("InvestmentProject");
    const InvestmentApplication = mongoose.model("InvestmentApplication");
    const EmploymentApplication = mongoose.model("EmploymentApplication");

    // Gather counter stats across your commercial sectors in parallel for maximum speed
    const [projectCount, totalApps, activeEmployees] = await Promise.all([
      InvestmentProject.countDocuments().catch(() => 0),
      InvestmentApplication.countDocuments().catch(() => 0),
      EmploymentApplication.countDocuments({ status: "Approved" }).catch(() => 0)
    ]);

    return res.status(200).json({
      success: true,
      summary: {
        activeCampaigns: projectCount,
        submittedApplications: totalApps,
        verifiedWorkforce: activeEmployees
      },
      data: {
        projectsCount: projectCount,
        applicationsCount: totalApps,
        workforceCount: activeEmployees
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

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
router.get("/analytics/pdf", protect, authorize("SuperAdmin", "BusinessAdmin"), analyticsReport);
router.get("/treasury/pdf", protect, authorize("SuperAdmin", "BusinessAdmin"), analyticsReport);

module.exports = router;
