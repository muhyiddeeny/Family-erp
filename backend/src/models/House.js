const mongoose = require("mongoose");

const houseSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    houseName: { type: String, trim: true },
    description: { type: String, default: "" },
    whatsappCommunityLink: { type: String, default: "" },
    status: { type: String, enum: ["VACANT", "OCCUPIED"], default: "VACANT" },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "Member" }]
  },
  { timestamps: true }
);

// Mongoose 9: pre hooks no longer use the `next` callback. Use an async function.
houseSchema.pre("save", async function () {
  if (this.houseName && !this.name) this.name = this.houseName;
  if (this.name && !this.houseName) this.houseName = this.name;
  if (!this.name && !this.houseName) {
    this.name = "Unnamed Family House Hub";
    this.houseName = "Unnamed Family House Hub";
  }
});

module.exports = mongoose.model("House", houseSchema);
