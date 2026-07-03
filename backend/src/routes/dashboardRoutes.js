const express = require("express");
const { getMemberDashboard } = require("../controllers/dashboardController");
const { protect } = require("../middlewares/authMiddleware"); // Import your session verification middleware

const router = express.Router();

/*
|--------------------------------------------------------------------------
| SECURE PERSONAL DASHBOARD ENDPOINT FEED
|--------------------------------------------------------------------------
| Appending 'protect' requires a valid authorization Bearer header block.
| This ensures your family member details, private WhatsApp group markers,
| and personal investment ledgers are fully shielded from cross-site snooping.
*/
router.get("/member/:memberId", protect, getMemberDashboard);

module.exports = router;
