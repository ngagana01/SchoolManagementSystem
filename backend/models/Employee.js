

const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      required: true,
      trim: true,
    },

    contact: {
      type: String,
      required: true,
      trim: true,
    },

    dateOfJoining: {
      type: Date,
    },

    monthlySalary: {
      type: Number,
      required: true,
      min: 0,
    },

    employeePhoto: {
      type: String,
      default: "",
    },

    nationalId: {
      type: String,
      default: "",
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    dateOfBirth: {
      type: Date,
    },

    bloodGroup: {
      type: String,
      default: "",
    },

    fatherOrHusbandName: {
      type: String,
      default: "",
    },

    experience: {
      type: String,
      default: "",
    },

    highestQualification: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },
    user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  unique: true,
  sparse: true,
},
isActive: {
  type: Boolean,
  default: true,
},
  },
  
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Employee", EmployeeSchema);
