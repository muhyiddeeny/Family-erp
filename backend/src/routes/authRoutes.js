
const express =
  require("express");

const {
  register,
  login,
  getMe
} = require(
  "../controllers/authController"
);

const {
  protect
} = require(
  "../middlewares/authMiddleware"
);

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "Authentication route working"
    });
  }
);

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/

router.post(
  "/register",
  register
);

router.post(
  "/login",
  login
);

/*
|--------------------------------------------------------------------------
| CURRENT USER
|--------------------------------------------------------------------------
*/

router.get(
  "/me",
  protect,
  getMe
);

module.exports =
  router;