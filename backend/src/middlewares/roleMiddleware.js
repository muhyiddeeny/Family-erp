const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    /*
    |--------------------------------------------------------------------------
    | MASTER SUPERADMIN OVERRIDE BYPASS LAYER
    |--------------------------------------------------------------------------
    | If the logged-in user possesses the absolute 'SuperAdmin' privilege tag,
    | we skip the array validation check and instantly pass them through.
    | This guarantees they never get locked out of custom sub-admin pages.
    */
    if (req.user.role === "SuperAdmin") {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Your account level does not hold sufficient platform clearance"
      });
    }

    next();
  };
};

module.exports = authorize;
