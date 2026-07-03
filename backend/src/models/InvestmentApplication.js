const mongoose = require("mongoose");

const allocationSchema =
  new mongoose.Schema(
    {
      projectId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "InvestmentProject",
        required: true
      },

      percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      }
    },
    {
      _id: false
    }
  );

const investmentApplicationSchema =
  new mongoose.Schema(
    {
      memberId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Member",
        required: true
      },

      totalInvestmentAmount: {
        type: Number,
        required: true,
        min: 1
      },

      familyShareAmount: {
        type: Number,
        required: true
      },

      personalInvestmentAmount: {
        type: Number,
        required: true
      },

      participationType: {
        type: String,
        enum: [
          "Partner",
          "Employee",
          "Both"
        ],
        required: true
      },

      allocations: [
        allocationSchema
      ],

      acceptedRuleId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "InvestmentRule",
        required: true
      },

      acceptedRuleVersion: {
        type: Number,
        required: true
      },

      acceptedAt: {
        type: Date,
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
  "InvestmentApplication",
  investmentApplicationSchema
);