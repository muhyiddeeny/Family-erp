const express = require("express");
const {
  register,
  login,
  getMe,
  adminResetMemberPassword,
  changePassword,
  verifyCurrentPassword,
  changePasswordWithCurrent,
  getDefaultPasswordSetting,
  updateDefaultPasswordSetting
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authentication route working"
  });
});

/*
|--------------------------------------------------------------------------
| AUTH MASTER CHANNELS
|--------------------------------------------------------------------------
*/
router.post("/register", register);
router.post("/login", login);

/*
|--------------------------------------------------------------------------
| SELF-SERVICE PASSWORD CHANGE (public: the member proves it is them with
| their current password, so no login is needed)
|--------------------------------------------------------------------------
*/
router.post("/verify-password", verifyCurrentPassword);
router.post("/change-password-with-current", changePasswordWithCurrent);

/*
|--------------------------------------------------------------------------
| PASSWORD MANAGEMENT
|--------------------------------------------------------------------------
| - Any logged-in user can change their own password.
| - Only SuperAdmin / MembershipAdmin can generate a temporary password for a member.
| - Only SuperAdmin / MembershipAdmin can view or change the default password
|   given to newly approved members.
*/
router.post("/change-password", protect, changePassword);
router.post(
  "/admin-reset-password",
  protect,
  authorize("SuperAdmin", "MembershipAdmin"),
  adminResetMemberPassword
);
router.get(
  "/default-password",
  protect,
  authorize("SuperAdmin", "MembershipAdmin"),
  getDefaultPasswordSetting
);
router.put(
  "/default-password",
  protect,
  authorize("SuperAdmin", "MembershipAdmin"),
  updateDefaultPasswordSetting
);

/*
|--------------------------------------------------------------------------
| CURRENT USER PROFILE DATA MAPS
|--------------------------------------------------------------------------
*/
router.get("/me", protect, getMe);

module.exports = router;
