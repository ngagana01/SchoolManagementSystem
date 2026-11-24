const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema(
  {
    period: {
      type: Number,
      required: true,
      min: 1,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Each period number must be unique.
timeSlotSchema.index({ period: 1 }, { unique: true });

module.exports = mongoose.model("TimeSlot", timeSlotSchema);