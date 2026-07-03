const express = require("express");
const {
  createHouse,
  getAllHouses,
  updateHouse,
  deleteHouse,
  assignMemberToHouse
} = require("../controllers/houseController");
const { protect } = require("../middlewares/authMiddleware"); // Import your session verification middleware
const authorize = require("../middlewares/roleMiddleware"); // Import your role checking middleware

const router = express.Router();

/*
|--------------------------------------------------------------------------
| HOUSING READ FEED (All Authenticated Members / Admins)
|--------------------------------------------------------------------------
| Appending 'protect' ensures regular members pull their respective house summaries 
| safely, while our controller filters out private links belonging to other houses.
*/
router.get("/", protect, getAllHouses);

/*
|--------------------------------------------------------------------------
| HOUSING STRUCTURE MANAGEMENT (SuperAdmin & HouseAdmin Only)
|--------------------------------------------------------------------------
| Creating residential partitions, shifting members, or modifying links 
| is strictly restricted to authorized administrative clearance paths.
*/
router.post("/", protect, authorize("SuperAdmin", "HouseAdmin"), createHouse);
router.put("/:id", protect, authorize("SuperAdmin", "HouseAdmin"), updateHouse);
router.delete("/:id", protect, authorize("SuperAdmin", "HouseAdmin"), deleteHouse);
router.patch("/:id/assign-member", protect, authorize("SuperAdmin", "HouseAdmin"), assignMemberToHouse);

module.exports = router;
