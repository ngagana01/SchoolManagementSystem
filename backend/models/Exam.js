
const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    examName: {
      type: String,
      required: true,
      trim: true,
    },

    examType: {
      type: String,
      required: true,
      enum: [
        "Unit Test",
        "Midterm",
        "Quarterly",
        "Half Yearly",
        "Annual",
        "Final Exam",
        "Other",
      ],
    },

    academicYear: {
      type: String,
      required: true,
      trim: true,
    },

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

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

examSchema.index(
  {
    examName: 1,
    academicYear: 1,
    className: 1,
    section: 1,
  },
  { unique: true }
);

module.exports = mongoose.model("Exam", examSchema);
