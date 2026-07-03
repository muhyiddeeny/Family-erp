const mongoose = require("mongoose");

const donationCampaignSchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        required: true
      },

      category: {
        type: String,
        enum: [
          "Medical Assistance",
          "Emergency Support",
          "Education Support",
          "Welfare Support",
          "Family Projects"
        ],
        required: true
      },

      description: {
        type: String,
        required: true
      },

      targetAmount: {
        type: Number,
        required: true
      },

      amountRaised: {
        type: Number,
        default: 0
      },

      status: {
        type: String,
        enum: [
          "OPEN",
          "CLOSED"
        ],
        default: "OPEN"
      }
    },
    {
      timestamps: true
    }
  );

module.exports = mongoose.model(
  "DonationCampaign",
  donationCampaignSchema
);