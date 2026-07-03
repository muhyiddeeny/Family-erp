const express = require("express");
const {
  createOperation,
  getOperations,
  getBusinessSummary
} = require("../controllers/businessOperationController");
const {
  createUpdate,
  getUpdates
} = require("../controllers/businessUpdateController");

const { protect } = require("../middlewares/authMiddleware"); // Import token validation
const authorize = require("../middlewares/roleMiddleware"); // Import role validation

const router = express.Router();

/*
|--------------------------------------------------------------------------
| FINANCIAL & OPERATION LOGS (SuperAdmin & BusinessAdmin Only)
|--------------------------------------------------------------------------
| Logging revenues, expenses, profits, or losses is highly restricted.
*/
router.post("/operations", protect, authorize("SuperAdmin", "BusinessAdmin"), createOperation);
router.post("/updates", protect, authorize("SuperAdmin", "BusinessAdmin"), createUpdate);

/*
|--------------------------------------------------------------------------
| READ-ONLY & VISUAL DATA FEEDS (All Authenticated Members)
|--------------------------------------------------------------------------
| Regular family members can view updates and financial summaries on their dashboards.
*/
router.get("/operations", protect, getOperations);
router.get("/summary", protect, getBusinessSummary);
router.get("/updates", protect, getUpdates);

module.exports = router;
