const mongoose = require("mongoose");

const feesStructureSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },


    feeType: {
      type: String,
      required: true,
      enum: ["Tuition Fee", "Exam Fee", "Transport Fee"],
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);
feesStructureSchema.index(
  { className: 1, section: 1, feeType: 1 },
  { unique: true }
);


module.exports = mongoose.model("FeesStructure", feesStructureSchema);