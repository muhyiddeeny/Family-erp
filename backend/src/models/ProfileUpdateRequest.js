const mongoose = require("mongoose");

const profileUpdateRequestSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true
    },

    // FIXED LAYER: Removed the rigid lowercase enum to support your model properties (like residentialAddress, numberOfChildren)
    fieldName: {
      type: String,
      required: true,
      trim: true
    },

    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },

    newValue: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending"
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("ProfileUpdateRequest", profileUpdateRequestSchema);
