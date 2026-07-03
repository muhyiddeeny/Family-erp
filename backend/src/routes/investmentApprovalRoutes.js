const express = require("express");
const {
  approveInvestmentApplication,
  rejectInvestmentApplication
} = require("../controllers/investmentApprovalController");
const { protect } = require("../middlewares/authMiddleware"); // Import your session verification middleware
const authorize = require("../middlewares/roleMiddleware"); // Import your role checking middleware

const router = express.Router();

/*
|--------------------------------------------------------------------------
| INVESTMENT TRANSACTION APPROVALS (SuperAdmin & BusinessAdmin Only)
|--------------------------------------------------------------------------
| Running payment verification checks, calculating share fund deductions,
| and committing records to the immutable ledger requires strict admin clearance.
*/
router.patch("/:id/approve", protect, authorize("SuperAdmin", "BusinessAdmin"), approveInvestmentApplication);
router.patch("/:id/reject", protect, authorize("SuperAdmin", "BusinessAdmin"), rejectInvestmentApplication);

module.exports = router;
