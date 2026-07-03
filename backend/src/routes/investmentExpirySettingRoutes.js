const express = require("express");
const {
  saveExpirySetting,
  getExpirySetting
} = require("../controllers/investmentExpirySettingController");
const { protect } = require("../middlewares/authMiddleware"); // Import your security protection middleware
const authorize = require("../middlewares/roleMiddleware"); // Import your role checking middleware

const router = express.Router();

/*
|--------------------------------------------------------------------------
| SECURE TIMEOUT MANAGEMENT (SuperAdmin & BusinessAdmin Only)
|--------------------------------------------------------------------------
| Fetching or altering the investment expiration deadline parameters 
| is strictly locked down to protect your background cron workflows.
*/
router.post("/", protect, authorize("SuperAdmin", "BusinessAdmin"), saveExpirySetting);
router.get("/", protect, authorize("SuperAdmin", "BusinessAdmin"), getExpirySetting);

module.exports = router;
