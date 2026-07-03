const mongoose = require("mongoose");

const investmentRuleAcceptanceSchema =
  new mongoose.Schema(
    {
      memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member",
        required: true
      },

      ruleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InvestmentRule",
        required: true
      },

      acceptedVersion: {
        type: Number,
        required: true
      },

      acceptanceDate: {
        type: Date,
        default: Date.now
      }
    },
    {
      timestamps: true
    }
  );

module.exports = mongoose.model(
  "InvestmentRuleAcceptance",
  investmentRuleAcceptanceSchema
);