
const mongoose = require("mongoose");

const timetableEntrySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
    timeSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimeSlot",
      required: true,
    },
    // ID of a nested subject inside the Subject document.
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { _id: false }
);

const timeTableSchema = new mongoose.Schema(
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
    entries: {
      type: [timetableEntrySchema],
      default: [],
    },
  },
  { timestamps: true }
);

timeTableSchema.index(
  { className: 1, section: 1 },
  { unique: true }
);

module.exports = mongoose.model("TimeTable", timeTableSchema);
