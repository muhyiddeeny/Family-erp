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
const mongoose = require("mongoose"); // FIXED LAYER: Import mongoose to access the safe model cache lookup
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

/*
|--------------------------------------------------------------------------
| FIXED LAYER: SAFE CACHED BUSINESS OPERATIONAL REPORTS ROUTE MATRIX
|--------------------------------------------------------------------------
| Resolves the 404 Not Found error explicitly by exposing data channels 
| to capture and stream historical records to your Investments dashboard grids.
| Uses mongoose.model cache lookup to prevent duplicate registration crashes on boot.
*/
router.get("/business-reports", protect, authorize("SuperAdmin", "BusinessAdmin"), async (req, res) => {
  try {
    const BusinessReport = mongoose.model("BusinessReport");
    const reports = await BusinessReport.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, reports });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/business-reports", protect, authorize("SuperAdmin", "BusinessAdmin"), async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Title and Content parameters are required." });
    }
    const BusinessReport = mongoose.model("BusinessReport");
    const report = await BusinessReport.create({ title, content });
    return res.status(201).json({ success: true, message: "Operational status report filed successfully.", report });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
