const express = require("express");
const {
  requestProfileUpdate,
  getAllProfileUpdates,
  approveProfileUpdate,
  rejectProfileUpdate
} = require("../controllers/profileUpdateController");
const { protect } = require("../middlewares/authMiddleware"); // Import token verification middleware
const authorize = require("../middlewares/roleMiddleware"); // Import dynamic role check middleware

const router = express.Router();

/*
|--------------------------------------------------------------------------
| REQUEST SUBMISSION LAYER (All Authenticated Members)
|--------------------------------------------------------------------------
| Allows any logged-in family member to initialize correction files safely.
*/
router.post("/", protect, requestProfileUpdate);

/*
|--------------------------------------------------------------------------
| QUEUE VERIFICATION CHANNELS (SuperAdmin & MembershipAdmin Only)
|--------------------------------------------------------------------------
| Screening requests, examining value modifications, and deploying data updates 
| is strictly restricted to authorized administrative clearance paths.
*/
router.get("/", protect, authorize("SuperAdmin", "MembershipAdmin"), getAllProfileUpdates);
router.patch("/:id/approve", protect, authorize("SuperAdmin", "MembershipAdmin"), approveProfileUpdate);
router.patch("/:id/reject", protect, authorize("SuperAdmin", "MembershipAdmin"), rejectProfileUpdate);

module.exports = router;
