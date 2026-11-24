
const mongoose = require("mongoose");

const salaryPaymentSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "Bank Transfer", "UPI", "Cheque", "Other"],
      default: "Bank Transfer",
    },

    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

salaryPaymentSchema.index({ employee: 1, year: 1, month: 1 });

module.exports = mongoose.model("SalaryPayment", salaryPaymentSchema);
