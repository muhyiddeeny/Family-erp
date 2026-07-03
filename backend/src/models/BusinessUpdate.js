const mongoose = require("mongoose");

const businessUpdateSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessCategory",
      required: true
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InvestmentProject",
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    updateDetails: {
      type: String,
      required: true,
      trim: true
    },

    // FIXED LAYER: Explicitly maps the author relationship link back to the User model
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("BusinessUpdate", businessUpdateSchema);
