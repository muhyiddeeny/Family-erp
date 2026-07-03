const mongoose = require("mongoose");

const employmentApplicationSchema =
  new mongoose.Schema(
    {
      memberId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Member",
        required: true
      },

      applicationType: {
        type: String,
        enum: [
          "Employee",
          "Partner",
          "Both"
        ],
        required: true
      },

      projectId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "InvestmentProject",
        required: true
      },

      applicationReason: {
        type: String,
        required: true
      },

      workExperience: {
        type: String,
        default: ""
      },

      status: {
        type: String,
        enum: [
          "Pending",
          "Approved",
          "Rejected"
        ],
        default: "Pending"
      },

      reviewedBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },

      reviewedAt: {
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
  "EmploymentApplication",
  employmentApplicationSchema
);