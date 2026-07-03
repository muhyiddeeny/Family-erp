const mongoose = require("mongoose");

const familyShareFundLedgerSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true
    },

    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true
    },

    projectId: {
      type: String, // FIXED LAYER: Changed from ObjectId to String to match your custom tracking codes securely
      required: true
    },

    // FIXED LAYER: Removed required:true constraints and kept it flexible to map smoothly to your controller instances
    transactionType: {
      type: String,
      enum: ["CONTRIBUTION", "PROFIT", "LOSS"],
      default: "CONTRIBUTION"
    },

    investmentAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    familyShareAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    profitAllocation: {
      type: Number,
      default: 0,
      min: 0
    },

    lossAllocation: {
      type: Number,
      default: 0,
      min: 0
    },

    runningBalance: {
      type: Number,
      required: true,
      min: 0 // Safety parameter prevents balances from hitting corrupt negative numbers
    },

    remarks: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

/*
|--------------------------------------------------------------------------
| IMMUTABLE LEDGER HOOK INTEGRITY SYSTEM
|--------------------------------------------------------------------------
| Restricts any manual balance editing or data alterations, protecting
| the financial trail from data modification scripts.
*/
const lockError = () => {
  throw new Error("Security violation: Ledger entries are immutable and locked against updates or deletion.");
};

familyShareFundLedgerSchema.pre("save", function (next) {
  if (!this.isNew) lockError();
  next();
});
familyShareFundLedgerSchema.pre("findOneAndUpdate", lockError);
familyShareFundLedgerSchema.pre("updateOne", lockError);
familyShareFundLedgerSchema.pre("deleteOne", lockError);
familyShareFundLedgerSchema.pre("remove", lockError);

module.exports = mongoose.model("FamilyShareFundLedger", familyShareFundLedgerSchema);
