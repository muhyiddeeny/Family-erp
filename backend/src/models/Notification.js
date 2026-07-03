const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: [
        "InvestmentApproval",
        "InvestmentRejection",
        "InvestmentExpiry", // FIXED LAYER: Added missing string key to support background thread tasks
        "DonationApproval",
        "DonationRejection",
        "ProfileApproval",
        "ProfileRejection",
        "EmploymentApproval",
        "EmploymentRejection",
        "SystemAlert",
        "Announcement"
      ],
      required: true
    },

    isRead: {
      type: Boolean,
      default: false
    },

    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
