
const mongoose = require("mongoose");

const studentFeeAssignmentSchema = new mongoose.Schema(
  {
    // Student who receives this fee assignment
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    // Academic year for this fee assignment
    academicYear: {
      type: String,
      required: true,
      trim: true,
    },

    // Fee category
    feeType: {
      type: String,
      required: true,
      enum: ["Tuition Fee", "Exam Fee", "Transport Fee"],
    },

    // Standard fee from the class/section fee structure
    standardAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Scholarship or discount amount
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Final amount the student must pay
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Optional reason for a scholarship or discount
    discountReason: {
      type: String,
      trim: true,
      default: "",
    },

    // Payment due date, if applicable
    dueDate: {
      type: Date,
    },

    // Assignment status
    status: {
      type: String,
      enum: ["Active", "Cancelled"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate assignments for the same student,
// academic year, and fee type.
studentFeeAssignmentSchema.index(
  { student: 1, academicYear: 1, feeType: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "StudentFeeAssignment",
  studentFeeAssignmentSchema
);
