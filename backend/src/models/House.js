const mongoose = require("mongoose");

const houseSchema = new mongoose.Schema(
  {
    // SUPPORT BOTH FIELD LOGICS: Bypasses your strict old collection name index locks smoothly
    name: {
      type: String,
      trim: true,
      default: function() {
        return this.houseName || "Unnamed Family House Hub";
      }
    },

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

// Pre-save validation layer: Ensures both name shapes mirror each other identically before writing to MongoDB Atlas
houseSchema.pre("save", function(next) {
  if (this.houseName && !this.name) {
    this.name = this.houseName;
  }
  if (this.name && !this.houseName) {
    this.houseName = this.name;
  }
  next();
});

module.exports = mongoose.model("House", houseSchema);
