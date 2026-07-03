const express = require("express");
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  closeProject,
  reopenProject
} = require("../controllers/investmentProjectController");

const { protect } = require("../middlewares/authMiddleware"); // Import session protector
const authorize = require("../middlewares/roleMiddleware"); // Import privilege controller guard

const router = express.Router();

/*
|--------------------------------------------------------------------------
| OPEN ASSET VISIBILITY (All Authenticated Members / Admins)
|--------------------------------------------------------------------------
| Regular family members can browse projects safely to make split allocations.
*/
router.get("/", protect, getProjects);
router.get("/:id", protect, getProjectById);

/*
|--------------------------------------------------------------------------
| ASSET INFRASTRUCTURE MANAGEMENT (SuperAdmin & BusinessAdmin Only)
|--------------------------------------------------------------------------
| Creating projects, editing max/min caps, or shutting down active project campaigns
| is strictly restricted to authorized financial management channels.
*/
router.post("/", protect, authorize("SuperAdmin", "BusinessAdmin"), createProject);
router.put("/:id", protect, authorize("SuperAdmin", "BusinessAdmin"), updateProject);
router.patch("/:id/close", protect, authorize("SuperAdmin", "BusinessAdmin"), closeProject);
router.patch("/:id/reopen", protect, authorize("SuperAdmin", "BusinessAdmin"), reopenProject);

module.exports = router;
