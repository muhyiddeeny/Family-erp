// const express = require("express");
// const {
//   approveInvestmentApplication,
//   rejectInvestmentApplication
// } = require("../controllers/investmentApprovalController");
// const { protect } = require("../middlewares/authMiddleware"); // Import your session verification middleware
// const authorize = require("../middlewares/roleMiddleware"); // Import your role checking middleware

// const router = express.Router();

// /*
// |--------------------------------------------------------------------------
// | INVESTMENT TRANSACTION APPROVALS (SuperAdmin & BusinessAdmin Only)
// |--------------------------------------------------------------------------
// | Running payment verification checks, calculating share fund deductions,
// | and committing records to the immutable ledger requires strict admin clearance.
// */
// router.patch("/:id/approve", protect, authorize("SuperAdmin", "BusinessAdmin"), approveInvestmentApplication);
// router.patch("/:id/reject", protect, authorize("SuperAdmin", "BusinessAdmin"), rejectInvestmentApplication);

// module.exports = router;
const express = require("express"); 
const { approveInvestmentApplication, rejectInvestmentApplication } = require("../controllers/investmentApprovalController"); 
const { protect } = require("../middlewares/authMiddleware"); 
const authorize = require("../middlewares/roleMiddleware"); 

const router = express.Router(); 

/* 
|-------------------------------------------------------------------------- 
| INVESTMENT TRANSACTION APPROVALS (SuperAdmin & BusinessAdmin Only) 
|-------------------------------------------------------------------------- 
*/ 

// SAFE CALL BLOCK: Executes the imported controller module explicitly 
router.patch("/:id/approve", protect, authorize("SuperAdmin", "BusinessAdmin"), async (req, res, next) => {
  try {
    return await approveInvestmentApplication(req, res);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// SAFE CALL BLOCK: Executes the imported controller module explicitly
router.patch("/:id/reject", protect, authorize("SuperAdmin", "BusinessAdmin"), async (req, res, next) => {
  try {
    return await rejectInvestmentApplication(req, res);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
