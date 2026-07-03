const {
  validationResult
} = require(
  "express-validator"
);

const validate =
  (
    req,
    res,
    next
  ) => {
    try {
      const errors =
        validationResult(
          req
        );

      if (
        !errors.isEmpty()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Validation failed",
          errors:
            errors.array()
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
  validate;