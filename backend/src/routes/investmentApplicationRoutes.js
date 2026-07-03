const express = require("express");
const {
  submitApplication,
  getApplications
} = require("../controllers/investmentApplicationController");
const { protect } = require("../middlewares/authMiddleware"); // Import your security protection middleware
const authorize = require("../middlewares/roleMiddleware"); // Import your role checking middleware

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PORTFOLIO SUBMISSION LAYER (All Authenticated Members)
|--------------------------------------------------------------------------
| Appending 'protect' ensures regular family members can initialize investment 
| applications safely from their respective member dashboards.
*/
router.post("/", protect, submitApplication);

/*
|--------------------------------------------------------------------------
| AUDITING EXPLORATION (SuperAdmin & BusinessAdmin Only)
|--------------------------------------------------------------------------
| Viewing the global ledger portfolio submission list is highly restricted 
| to authorized financial management channels.
*/
router.get("/", protect, authorize("SuperAdmin", "BusinessAdmin"), getApplications);

module.exports = router;
