const express = require("express");
const {
  getFundSummary,
  getGrowthHistory,
  getProfitHistory,
  getLossHistory
} = require("../controllers/familyShareFundController");
const {
  allocateProfit,
  allocateLoss
} = require("../controllers/familyShareAllocationController");

const { protect } = require("../middlewares/authMiddleware"); // Import token validation guard
const authorize = require("../middlewares/roleMiddleware"); // Import privilege controller guard

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PRIVATE DIVIDEND & LOSS ALLOCATIONS (SuperAdmin & BusinessAdmin Only)
|--------------------------------------------------------------------------
| Writing updates, moving money, or modifying profit/loss ledger weights
| is strictly locked down to protect your immutable financial history.
*/
router.post("/profit", protect, authorize("SuperAdmin", "BusinessAdmin"), allocateProfit);
router.post("/loss", protect, authorize("SuperAdmin", "BusinessAdmin"), allocateLoss);

/*
|--------------------------------------------------------------------------
| READ-ONLY LEDGER DATA FEEDS (All Authenticated Members / Admins)
|--------------------------------------------------------------------------
| Regular family members can safely pull these summaries to populate the 
| charts on their respective member dashboards.
*/
router.get("/summary", protect, getFundSummary);
router.get("/growth-history", protect, getGrowthHistory);
router.get("/profit-history", protect, getProfitHistory);
router.get("/loss-history", protect, getLossHistory);

module.exports = router;
