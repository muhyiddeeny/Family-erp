const express = require("express");
const {
  createPermission,
  getPermissions,
  getRoles // FIXED LAYER: Import the fresh dynamic roles retriever action handle
} = require("../controllers/permissionController");
const { protect } = require("../middlewares/authMiddleware"); 
const authorize = require("../middlewares/roleMiddleware"); 

const router = express.Router();

/*
|--------------------------------------------------------------------------
| ROLE-BASED ACCESS CONTROL ENDPOINTS (SuperAdmin Only)
|--------------------------------------------------------------------------
*/
router.post("/", protect, authorize("SuperAdmin"), createPermission);
router.get("/", protect, authorize("SuperAdmin"), getPermissions);

/*
|--------------------------------------------------------------------------
| FIXED LAYER: MOUNT THE MISSED SYSTEM CONTROL ROLES GATEWAY ROUTE
|--------------------------------------------------------------------------
| Maps GET /api/permissions/roles cleanly to stop your client dashboard 
| network rejections and allow the tables to sync data flawlessly.
*/
router.get("/roles", protect, authorize("SuperAdmin"), getRoles);

module.exports = router;
