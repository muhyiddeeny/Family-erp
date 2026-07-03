const checkPermission =
  (permissionName) =>
  (req, res, next) => {
    try {
      const permissions =
        req.user.roleId
          ?.permissions || [];

      const allowed =
        permissions.some(
          (permission) =>
            permission.name ===
            permissionName
        );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message:
            "Permission denied"
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  };

module.exports =
  checkPermission;