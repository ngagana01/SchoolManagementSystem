
const mongoose = require("mongoose");

// Options for MCQ questions
const QuestionOptionSchema = new mongoose.Schema(
  {
    optionText: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

// Questions for online quizzes and tests
const QuestionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
      trim: true,
    },

    questionType: {
      type: String,
      enum: ["MCQ", "True/False", "Short Answer", "Long Answer"],
      required: true,
    },

    options: {
      type: [QuestionOptionSchema],
      default: [],
    },

    // For MCQ: index of the correct option (0, 1, 2...)
    correctOptionIndex: {
      type: Number,
      default: null,
      min: 0,
    },

    // For True/False questions
    correctBooleanAnswer: {
      type: Boolean,
      default: null,
    },

    // Optional reference answer for teacher evaluation
    expectedAnswer: {
      type: String,
      default: "",
      trim: true,
    },

    marks: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: false }
);

const AssignmentSchema = new mongoose.Schema(
  {
    // Existing assignment fields
    title: {
      type: String,
      required: true,
      trim: true,
    },

    assignmentType: {
      type: String,
      required: true,
      enum: [
        "Homework",
        "Quiz",
        "Class Test",
        "Project",
        "Assignment",
        "Other",
      ],
    },

    instructions: {
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

    subjectName: {
      type: String,
      required: true,
      trim: true,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    academicYear: {
      type: String,
      default: "",
      trim: true,
    },

    assignedDate: {
      type: Date,
      default: Date.now,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    attachment: {
      type: String,
      default: "",
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    totalMarks: {
      type: Number,
      default: null,
      min: 0,
    },

    // New: online quiz/test questions
    questions: {
      type: [QuestionSchema],
      default: [],
    },

    // New: quiz/test settings
    assessmentSettings: {
      startAt: {
        type: Date,
        default: null,
      },

      endAt: {
        type: Date,
        default: null,
      },

      durationMinutes: {
        type: Number,
        default: null,
        min: 1,
      },

      // Keep one attempt for compatibility with the current
      // one-submission-per-student workflow.
      maxAttempts: {
        type: Number,
        default: 1,
        min: 1,
      },

      allowLateSubmission: {
        type: Boolean,
        default: false,
      },

      showResultsAfterEvaluation: {
        type: Boolean,
        default: true,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", AssignmentSchema);
