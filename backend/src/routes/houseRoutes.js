const express = require("express");
const {
  createHouse,
  getAllHouses,
  updateHouse,
  deleteHouse,
  assignMemberToHouse
} = require("../controllers/houseController");
const { protect, optionalProtect } = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| HOUSING READ FEED
| Anyone can read the house list (the sign-up form needs it), but private
| WhatsApp links are only included for admins and members of that house.
| optionalProtect reads the login token when one is sent.
|--------------------------------------------------------------------------
*/
router.get("/", optionalProtect, getAllHouses);

/*
|--------------------------------------------------------------------------
| HOUSING STRUCTURE MANAGEMENT (SuperAdmin & HouseAdmin Only)
|--------------------------------------------------------------------------
*/
router.post("/", protect, authorize("SuperAdmin", "HouseAdmin"), createHouse);
router.put("/:id", protect, authorize("SuperAdmin", "HouseAdmin"), updateHouse);
router.delete("/:id", protect, authorize("SuperAdmin", "HouseAdmin"), deleteHouse);
router.patch("/:id/assign-member", protect, authorize("SuperAdmin", "HouseAdmin"), assignMemberToHouse);

module.exports = router;
