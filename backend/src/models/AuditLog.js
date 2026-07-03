const mongoose =
  require("mongoose");

const auditLogSchema =
  new mongoose.Schema(
    {
      userId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },

      module: {
        type: String,
        required: true,
        trim: true
      },

      action: {
        type: String,
        required: true,
        trim: true
      },

      oldValue: {
        type:
          mongoose.Schema.Types.Mixed,
        default: null
      },

      newValue: {
        type:
          mongoose.Schema.Types.Mixed,
        default: null
      },

      ipAddress: {
        type: String,
        default: ""
      },

      userAgent: {
        type: String,
        default: ""
      }
    },
    {
      timestamps: true
    }
  );

module.exports =
  mongoose.model(
    "AuditLog",
    auditLogSchema
  );