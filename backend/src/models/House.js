const mongoose = require("mongoose");

const houseSchema = new mongoose.Schema(
  {
    // FIXED LAYER: Synchronized property name key with your controllers
    houseName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    whatsappCommunityLink: {
      type: String,
      default: ""
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member"
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("House", houseSchema);
