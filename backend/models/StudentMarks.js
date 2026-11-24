
const mongoose = require("mongoose");

const StudentMarksSchema = new mongoose.Schema(
  {
    // Student whose marks are being recorded
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    // Teacher who entered the marks
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Student's academic details at the time of the exam
    className: {
      type: String,
      required: true,
      trim: true,
    },

    section: {
      type: String,
      default: "",
      trim: true,
    },

    academicYear: {
      type: String,
      required: true,
      trim: true,
    },

    // Subject and examination details
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },

    examName: {
      type: String,
      required: true,
      trim: true,
    },

    // Maximum marks come from the Subject model
    maxMarks: {
      type: Number,
      required: true,
      min: 1,
    },

    obtainedMarks: {
      type: Number,
      required: true,
      min: 0,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    // Students can see marks only after publication
    isPublished: {
      type: Boolean,
      default: false,
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate marks for the same student,
// subject, exam, and academic year.
StudentMarksSchema.index(
  {
    student: 1,
    subjectName: 1,
    examName: 1,
    academicYear: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "StudentMarks",
  StudentMarksSchema
);
