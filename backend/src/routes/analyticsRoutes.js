const express = require("express");
const { getAnalytics } = require("../controllers/analyticsController");
const { protect } = require("../middlewares/authMiddleware"); // Import your security protection middleware
const authorize = require("../middlewares/roleMiddleware"); // Import your role checking middleware

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PROTECTED CORE METRICS ROUTING LAYER
|--------------------------------------------------------------------------
| Adding protect ensures that only users with a valid access token can connect.
| Adding authorize restrictions locks down access exclusively to SuperAdmin accounts,
| shielding organization statistics from regular member dashboard accounts.
*/
router.get("/", protect, authorize("SuperAdmin"), getAnalytics);

module.exports = router;
