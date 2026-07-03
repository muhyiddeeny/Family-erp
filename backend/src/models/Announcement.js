const mongoose =
  require("mongoose");

const announcementSchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
        trim: true
      },

      message: {
        type: String,
        required: true,
        trim: true
      },

      isActive: {
        type: Boolean,
        default: true
      },

      createdBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },

      publishedAt: {
        type: Date,
        default:
          Date.now
      }
    },
    {
      timestamps: true
    }
  );

module.exports =
  mongoose.model(
    "Announcement",
    announcementSchema
  );