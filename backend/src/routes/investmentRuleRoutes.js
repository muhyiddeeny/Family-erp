const express = require("express");
const {
  createRule,
  getRules,
  getRuleById,
  updateRule,
  activateRule,
  deactivateRule
} = require("../controllers/investmentRuleController");

const { protect } = require("../middlewares/authMiddleware"); // Import token validation guard
const authorize = require("../middlewares/roleMiddleware"); // Import privilege controller guard

const router = express.Router();

/*
|--------------------------------------------------------------------------
| OPEN REGULATORY READ ACCESS (All Authenticated Members / Admins)
|--------------------------------------------------------------------------
| Regular family members can look up active policy versions safely.
*/
router.get("/", protect, getRules);
router.get("/:id", protect, getRuleById);

/*
|--------------------------------------------------------------------------
| CORPORATE REGULATORY MANAGEMENT (SuperAdmin & BusinessAdmin Only)
|--------------------------------------------------------------------------
| Pushing draft rules, altering min caps, or activating version updates
| is strictly locked down to protect your legal signing history.
*/
router.post("/", protect, authorize("SuperAdmin", "BusinessAdmin"), createRule);
router.put("/:id", protect, authorize("SuperAdmin", "BusinessAdmin"), updateRule);
router.patch("/:id/activate", protect, authorize("SuperAdmin", "BusinessAdmin"), activateRule);
router.patch("/:id/deactivate", protect, authorize("SuperAdmin", "BusinessAdmin"), deactivateRule);

module.exports = router;
