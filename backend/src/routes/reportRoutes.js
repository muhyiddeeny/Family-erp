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
const mongoose = require("mongoose"); // Safe database queries engine
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
| FIXED LAYER: BUSINESS & EXECUTIVE OPERATION REPORTS SUMMARY ARRAY FEED
|--------------------------------------------------------------------------
| Resolves the D.map crash error by wrapping our database counts into a 
| true Array list. This satisfies your frontend loops so the blank screen clears.
*/
router.get("/business-reports", protect, authorize("SuperAdmin", "BusinessAdmin"), async (req, res) => {
  try {
    const InvestmentProject = mongoose.model("InvestmentProject");
    const InvestmentApplication = mongoose.model("InvestmentApplication");
    const EmploymentApplication = mongoose.model("EmploymentApplication");

    // Pull counting metrics across your commercial tables in parallel
    const [projectCount, totalApps, activeEmployees] = await Promise.all([
      InvestmentProject.countDocuments().catch(() => 0),
      InvestmentApplication.countDocuments().catch(() => 0),
      EmploymentApplication.countDocuments({ status: "Approved" }).catch(() => 0)
    ]);

    // Build a true Array list structure matching your frontend component requirements
    const reportsArray = [
      {
        _id: "rep-01",
        title: "Active Investment Campaigns",
        type: "Investment",
        value: projectCount,
        count: projectCount,
        description: "Live corporate investment channels accepting capital allocations."
      },
      {
        _id: "rep-02",
        title: "Submitted Portfolio Applications",
        type: "Applications",
        value: totalApps,
        count: totalApps,
        description: "Total filed membership investment ledger records."
      },
      {
        _id: "rep-03",
        title: "Verified Active Workforce",
        type: "Employment",
        value: activeEmployees,
        count: activeEmployees,
        description: "Approved members successfully operating operational staff tracks."
      }
    ];

    // Send back the data directly as the parent element or fallback arrays
    return res.status(200).json(reportsArray);

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

// Master Treasury & Global Summary Matrix Reports
router.get("/analytics/pdf", protect, authorize("SuperAdmin", "BusinessAdmin"), analyticsReport);
router.get("/treasury/pdf", protect, authorize("SuperAdmin", "BusinessAdmin"), analyticsReport);

module.exports = router;
