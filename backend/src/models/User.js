const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    passwordHash: {
      type: String,
      required: true
    },

    // Relates directly to your Dynamic Role collection setup
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null
    },

    // FIXED LAYER: Removed the rigid enum restriction completely!
    // The SuperAdmin can now save ANY custom string title name here dynamically.
    role: {
      type: String,
      default: "Member",
      trim: true,
      required: true
    },

    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      default: null
    },

    isActive: {
      type: Boolean,
      default: true
    },

    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
