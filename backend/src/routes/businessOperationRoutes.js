const express = require("express");
const {
  createOperation,
  getOperations,
  getBusinessSummary,
  updateOperation,
  deleteOperation
} = require("../controllers/businessOperationController");
const {
  createUpdate,
  getUpdates,
  updateUpdate,
  deleteUpdate
} = require("../controllers/businessUpdateController");

const { protect } = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| FINANCIAL & OPERATION LOGS (SuperAdmin & BusinessAdmin Only)
|--------------------------------------------------------------------------
| Revenue, expenses, profit, loss and business updates.
| Every record must belong to a category and a project.
*/
router.post("/operations", protect, authorize("SuperAdmin", "BusinessAdmin"), createOperation);
router.put("/operations/:id", protect, authorize("SuperAdmin", "BusinessAdmin"), updateOperation);
router.delete("/operations/:id", protect, authorize("SuperAdmin", "BusinessAdmin"), deleteOperation);

router.post("/updates", protect, authorize("SuperAdmin", "BusinessAdmin"), createUpdate);
router.put("/updates/:id", protect, authorize("SuperAdmin", "BusinessAdmin"), updateUpdate);
router.delete("/updates/:id", protect, authorize("SuperAdmin", "BusinessAdmin"), deleteUpdate);

/*
|--------------------------------------------------------------------------
| READ-ONLY & VISUAL DATA FEEDS (All Authenticated Members)
|--------------------------------------------------------------------------
*/
router.get("/operations", protect, getOperations);
router.get("/summary", protect, getBusinessSummary);
router.get("/updates", protect, getUpdates);

module.exports = router;
