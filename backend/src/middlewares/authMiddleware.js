const jwt = require("jsonwebtoken");
const User = require("../models/User");

const extractToken = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
};

/*
|--------------------------------------------------------------------------
| PROTECT: the request must carry a valid token
|--------------------------------------------------------------------------
*/
const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required: Missing access token"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const lookupId = decoded.userId || decoded.id;
    const user = await User.findById(lookupId).select("-passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed: Authorized profile no longer exists"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Access token is invalid or expired"
    });
  }
};

/*
|--------------------------------------------------------------------------
| OPTIONAL PROTECT: never blocks the request.
| If a valid token is sent, req.user is filled in; otherwise the request
| continues as an anonymous visitor.
|--------------------------------------------------------------------------
*/
const optionalProtect = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId || decoded.id).select("-passwordHash");
      if (user) req.user = user;
    }
  } catch (error) {
    // Invalid or expired token: continue as an anonymous visitor
  }
  next();
};

module.exports = { protect, optionalProtect };
