const mongoose = require("mongoose");

const investmentRuleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    version: {
      type: Number,
      required: true,
      default: 1
    },

    // FIXED LAYER: Changed default initialization block to false to guarantee active rule exclusivity
    isActive: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("InvestmentRule", investmentRuleSchema);
