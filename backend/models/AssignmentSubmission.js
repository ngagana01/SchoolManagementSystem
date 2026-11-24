
const mongoose = require("mongoose");

// Each student's answer to an individual question
const StudentAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // Used for written answers
    answerText: {
      type: String,
      default: "",
      trim: true,
    },

    // Used for MCQ questions
    selectedOptionIndex: {
      type: Number,
      default: null,
      min: 0,
    },

    // Used for True/False questions
    booleanAnswer: {
      type: Boolean,
      default: null,
    },

    // Marks awarded manually by the teacher for this question
    marksObtained: {
      type: Number,
      default: null,
      min: 0,
    },

    teacherRemarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: false }
);

const AssignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    // Existing written assignment answer
    answer: {
      type: String,
      default: "",
      trim: true,
    },

    attachment: {
      type: String,
      default: "",
    },

    // New: answers submitted for online quizzes/tests
    answers: {
      type: [StudentAnswerSchema],
      default: [],
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["Submitted", "Reviewed", "Late"],
      default: "Submitted",
    },

    // Existing overall teacher feedback
    teacherRemarks: {
      type: String,
      default: "",
      trim: true,
    },

    // Existing overall marks awarded by the teacher
    marksObtained: {
      type: Number,
      default: null,
      min: 0,
    },

    // New: automatically calculated marks for objective questions
    autoMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    // New: evaluation progress
    evaluationStatus: {
      type: String,
      enum: [
        "Pending",
        "AutoEvaluated",
        "PartiallyEvaluated",
        "Evaluated",
      ],
      default: "Pending",
    },

    // New: number of the student's attempt
    attemptNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { timestamps: true }
);

// Preserve the existing one-submission-per-student rule.
// Multiple attempts will need a separate controller and index change.
AssignmentSubmissionSchema.index(
  {
    assignment: 1,
    student: 1,
  },
  { unique: true }
);

module.exports = mongoose.model(
  "AssignmentSubmission",
  AssignmentSubmissionSchema
);
