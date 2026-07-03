const express = require("express");
const router = express.Router();
const { getAuditLogs } = require("../controllers/auditLogController");
const { protect } = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

/*
|--------------------------------------------------------------------------
| LIVE SECURITY AUDIT TRAIL ENDPOINT
|--------------------------------------------------------------------------
| Strictly restricted to SuperAdmin accounts only. This ensures that no 
| standard sub-admins or general family members can crawl the system logs.
*/
router.get("/", protect, authorize("SuperAdmin"), getAuditLogs);

module.exports = router;
