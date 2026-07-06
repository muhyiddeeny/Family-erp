const express = require("express");
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

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
| PASSWORD RECOVERY PIPELINES (Public Gateway Access)
|--------------------------------------------------------------------------
| These endpoints must remain unprotected by token guards so locked-out 
| users can transmit account recovery signatures to get new system keys.
*/
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

/*
|--------------------------------------------------------------------------
| CURRENT USER PROFILE DATA MAPS
|--------------------------------------------------------------------------
*/
router.get("/me", protect, getMe);

module.exports = router;
