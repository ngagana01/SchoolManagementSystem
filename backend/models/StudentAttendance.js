
const mongoose = require("mongoose");

const studentAttendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    className: {
      type: String,
      required: true,
    },

    section: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["Present", "Absent", "Leave"],
      required: true,
    },
  },
  { timestamps: true }
);

// One attendance record per student per date
studentAttendanceSchema.index(
  { student: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "StudentAttendance",
  studentAttendanceSchema
);
