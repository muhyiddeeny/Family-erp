const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    // FIXED LAYER: Explicitly tracks the parent category module grouping field key
    module: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Permission", permissionSchema);
