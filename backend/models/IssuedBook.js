
const mongoose = require("mongoose");

const issuedBookSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    bookId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    userType: {
      type: String,
      required: true,
      enum: ["Student", "Teacher"],
    },
    issuedDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    fine: {
  type: Number,
  default: 0,
  min: 0,
},
    status: {
      type: String,
      enum: ["Issued", "Returned"],
      default: "Issued",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("IssuedBook", issuedBookSchema);
