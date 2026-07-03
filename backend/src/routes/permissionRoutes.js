const express = require("express");
const {
  createPermission,
  getPermissions
} = require("../controllers/permissionController");
const { protect } = require("../middlewares/authMiddleware"); // Import token verification
const authorize = require("../middlewares/roleMiddleware"); // Import role constraint checking

const router = express.Router();

/*
|--------------------------------------------------------------------------
| ROLE-BASED ACCESS CONTROL ENDPOINTS (SuperAdmin Only)
|--------------------------------------------------------------------------
| Creating or viewing global clearance parameters is highly restricted.
| This ensures that only the SuperAdmin can modify system security matrix keys.
*/
router.post("/", protect, authorize("SuperAdmin"), createPermission);
router.get("/", protect, authorize("SuperAdmin"), getPermissions);

module.exports = router;
