const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    middleName: {
      type: String,
      trim: true,
      default: "",
    },

    lastName: {
      type: String,
      trim: true,
      default: "",
    },

    dob: {
      type: Date,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },

    nationality: {
      type: String,
      default: "",
    },

    blood: {
      type: String,
      default: "",
    },

    religion: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      default: "",
    },

    studentPhoto: {
      type: String,
      default: "",
    },

    // Contact Information

    state: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    fatherName: {
      type: String,
      default: "",
    },

    motherName: {
      type: String,
      default: "",
    },

    parentsContact: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    // Academic Information

    admissionDate: {
      type: Date,
    },

    rollNumber: {
      type: String,
      default: "",
    },

    academicYear: {
      type: String,
      default: "",
    },

    previousSchool: {
      type: String,
      default: "",
    },

    currentClass: {
      type: String,
      required: true,
    },

    section: {
      type: String,
      default: "",
    },
    // Link Student record with User login account
user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  unique: true,
  sparse: true,
},

    transferCertificate: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Student", StudentSchema);