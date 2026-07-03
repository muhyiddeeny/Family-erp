const mongoose = require("mongoose");

const investmentProjectSchema = new mongoose.Schema(
  {
    // FIXED LAYER: Synchronized property key name with your controllers
    projectName: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessCategory",
      required: true
    },

    status: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN"
    },

    minimumInvestment: {
      type: Number,
      default: 0,
      min: 0
    },

    maximumInvestment: {
      type: Number,
      default: 0,
      min: 0
    },

    expectedROI: {
      type: Number,
      default: 0
    },

    openingDate: {
      type: Date,
      default: Date.now
    },

    closingDate: {
      type: Date,
      default: null
    },

    isVisible: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("InvestmentProject", investmentProjectSchema);
