const mongoose = require("mongoose");

const businessOperationSchema =
  new mongoose.Schema(
    {
      categoryId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "BusinessCategory",
        required: true
      },

      projectId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "InvestmentProject",
        required: true
      },

      operationType: {
        type: String,
        enum: [
          "Revenue",
          "Expense",
          "Profit",
          "Loss"
        ],
        required: true
      },

      amount: {
        type: Number,
        required: true,
        min: 0
      },

      description: {
        type: String,
        default: ""
      },

      operationDate: {
        type: Date,
        default: Date.now
      }
    },
    {
      timestamps: true
    }
  );

module.exports = mongoose.model(
  "BusinessOperation",
  businessOperationSchema
);