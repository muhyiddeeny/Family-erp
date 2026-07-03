const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  /*
  |--------------------------------------------------------------------------
  | UNIFIED SESSION CLAIMS PAYLOAD LAYER
  |--------------------------------------------------------------------------
  | Explicitly passes BOTH 'userId' and 'id' to guarantee complete token tracking
  | mapping synchronization across your middlewares and route context handlers.
  | Ensures email strings are passed in a lowercase format.
  | All string tokens default to '7d' if JWT_EXPIRES_IN environment variables are unset.
  */
  return jwt.sign(
    {
      id: user._id,
      userId: user._id, // FIXED LAYER: Passes explicit unified ID property tracking key
      role: user.role || "Member",
      email: user.email ? user.email.toLowerCase() : ""
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    }
  );
};

module.exports = generateToken;
