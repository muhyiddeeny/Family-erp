const express = require("express");
const mongoose = require("mongoose");
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
const BusinessReport = require("../models/BusinessReport");
const InvestmentProject = require("../models/InvestmentProject");
const InvestmentApplication = require("../models/InvestmentApplication");
const EmploymentApplication = require("../models/EmploymentApplication");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| BUSINESS OPERATIONAL PROGRESS REPORTS
|--------------------------------------------------------------------------
| GET    -> filed reports (newest first) followed by 3 live count snapshots
| POST   -> file a new report
| PUT    -> edit a filed report
| DELETE -> remove a filed report
| The 3 live snapshots are calculated on the fly and are read-only.
*/
router.get("/business-reports", protect, authorize("SuperAdmin", "BusinessAdmin"), async (req, res) => {
  try {
    const [projectCount, totalApps, activeEmployees, savedReports] = await Promise.all([
      InvestmentProject.countDocuments().catch(() => 0),
      InvestmentApplication.countDocuments().catch(() => 0),
      EmploymentApplication.countDocuments({ status: "Approved" }).catch(() => 0),
      BusinessReport.find().sort({ createdAt: -1 }).lean().catch(() => [])
    ]);

    const liveSnapshots = [
      { _id: "rep-01", readOnly: true, title: "Active Investment Campaigns", type: "Investment", value: projectCount, count: projectCount, description: "Live corporate investment channels accepting capital allocations." },
      { _id: "rep-02", readOnly: true, title: "Submitted Portfolio Applications", type: "Applications", value: totalApps, count: totalApps, description: "Total filed membership investment ledger records." },
      { _id: "rep-03", readOnly: true, title: "Verified Active Workforce", type: "Employment", value: activeEmployees, count: activeEmployees, description: "Approved members successfully operating operational staff tracks." }
    ];

    return res.status(200).json([...savedReports, ...liveSnapshots]);
  } catch (error) {
    console.error("GET business-reports error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/business-reports", protect, authorize("SuperAdmin", "BusinessAdmin"), async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const content = String(req.body.content || "").trim();

    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Both a title and the report content are required." });
    }

    const report = await BusinessReport.create({
      title,
      content,
      createdBy: req.user?._id || null
    });

    return res.status(201).json({
      success: true,
      message: "Operational progress report filed successfully.",
      report
    });
  } catch (error) {
    console.error("POST business-reports error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/business-reports/:id", protect, authorize("SuperAdmin", "BusinessAdmin"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "This item cannot be edited." });
    }

    const title = String(req.body.title || "").trim();
    const content = String(req.body.content || "").trim();

    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Both a title and the report content are required." });
    }

    const report = await BusinessReport.findByIdAndUpdate(
      req.params.id,
      { title, content },
      { new: true, runValidators: true }
    );

    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    return res.status(200).json({ success: true, message: "Report updated successfully.", report });
  } catch (error) {
    console.error("PUT business-reports error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/business-reports/:id", protect, authorize("SuperAdmin", "BusinessAdmin"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "This item cannot be deleted." });
    }

    const report = await BusinessReport.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    return res.status(200).json({ success: true, message: "Report deleted successfully." });
  } catch (error) {
    console.error("DELETE business-reports error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/*
|--------------------------------------------------------------------------
| SECURE EXPORT COMPILATION REPOSITORY LAYERS
|--------------------------------------------------------------------------
*/
router.get("/members/pdf", protect, authorize("SuperAdmin", "MembershipAdmin"), memberReport);
router.get("/houses/pdf", protect, authorize("SuperAdmin", "MembershipAdmin"), houseReport);

router.get("/investments/pdf", protect, authorize("SuperAdmin", "BusinessAdmin"), investmentReport);
router.get("/employment/pdf", protect, authorize("SuperAdmin", "BusinessAdmin"), employmentReport);

router.get("/donations/pdf", protect, authorize("SuperAdmin", "DonationAdmin"), donationReport);

router.get("/analytics/pdf", protect, authorize("SuperAdmin", "BusinessAdmin"), analyticsReport);
router.get("/treasury/pdf", protect, authorize("SuperAdmin", "BusinessAdmin"), analyticsReport);

module.exports = router;
