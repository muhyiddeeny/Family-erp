const mongoose = require("mongoose");

const donationSchema =
  new mongoose.Schema(
    {
      memberId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Member",
        required: true
      },

      campaignId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "DonationCampaign",
        required: true
      },

      amount: {
        type: Number,
        required: true
      },

      status: {
        type: String,
        enum: [
          "Pending",
          "Approved",
          "Rejected",
          "Expired"
        ],
        default: "Pending"
      },

      paymentVerified: {
        type: Boolean,
        default: false
      },

      paymentVerifiedAt: {
        type: Date,
        default: null
      },

      expiryDate: {
        type: Date,
        default: null
      },

      adminRemark: {
        type: String,
        default: ""
      }
    },
    {
      timestamps: true
    }
  );

module.exports = mongoose.model(
  "Donation",
  donationSchema
);