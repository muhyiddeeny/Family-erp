const mongoose = require("mongoose");

const investmentExpirySettingSchema = new mongoose.Schema(
  {
    // FIXED LAYER: Removed rigid enum restrictions to ensure absolute data insertion safety
    expiryDays: {
      type: Number,
      required: true,
      default: 7
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "InvestmentExpirySetting",
  investmentExpirySettingSchema
);
