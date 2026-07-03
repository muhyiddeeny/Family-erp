const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required: Missing access token"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /*
    |--------------------------------------------------------------------------
    | BALANCED TARGET LOOKUP LAYER (Fixes lookup key and credential leak bugs)
    |--------------------------------------------------------------------------
    | Fallback checking logic reads both 'userId' and 'id' payload property options.
    | Changing select parameter to '-passwordHash' explicitly filters out credentials.
    */
    const lookupId = decoded.userId || decoded.id;
    const user = await User.findById(lookupId).select("-passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed: Authorized profile no longer exists"
      });
    }

    // Attach the clean user profile record block securely to the running threat
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Access token is invalid or expired"
    });
  }
};

module.exports = {
  protect
};
