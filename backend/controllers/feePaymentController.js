const mongoose = require("mongoose");
const FeePayment = require("../models/FeePayment");
const Student = require("../models/Student");
const FeesStructure = require("../models/FeesStructure");

// Record a student fee payment
exports.addFeePayment = async (req, res) => {
  try {
    const {
      student,
      feeType,
      amount,
      paymentDate,
      paymentMethod,
      receiptNumber,
      remarks,
    } = req.body;

    if (!student || !feeType || amount === undefined || amount === "") {
      return res.status(400).json({
        success: false,
        message: "Student, fee type, and amount are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(student)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID.",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than zero.",
      });
    }

    const validFeeTypes = [
      "Tuition Fee",
      "Exam Fee",
      "Transport Fee",
    ];

    if (!validFeeTypes.includes(feeType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid fee type.",
      });
    }

    const studentRecord = await Student.findById(student);

    if (!studentRecord) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const normalizeClassName = (value = "") =>
  String(value).trim().replace(/^class\s+/i, "");

const feeStructures = await FeesStructure.find({
  section: studentRecord.section,
  feeType,
});

const feeStructure = feeStructures.find(
  (fee) =>
    normalizeClassName(fee.className) ===
    normalizeClassName(studentRecord.currentClass)
);

if (!feeStructure) {
  return res.status(404).json({
    success: false,
    message:
      "No matching fee structure exists for this student's class and section.",
  });
}

    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        message: "No matching fee structure exists for this student's class.",
      });
    }

    // Calculate previous payments for this student and fee type.
    const previousPayments = await FeePayment.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(student),
          feeType,
        },
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$amount" },
        },
      },
    ]);

    const alreadyPaid = previousPayments[0]?.totalPaid || 0;
    const remainingBalance = feeStructure.amount - alreadyPaid;

    if (numericAmount > remainingBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment exceeds the remaining balance of ₹${Math.max(
          remainingBalance,
          0
        )}.`,
      });
    }

    const payment = await FeePayment.create({
      student,
      feeType,
      amount: numericAmount,
      paymentDate: paymentDate || Date.now(),
      paymentMethod: paymentMethod || "Cash",
      receiptNumber,
      remarks,
    });

    return res.status(201).json({
      success: true,
      message: "Fee payment recorded successfully.",
      data: payment,
    });
  } catch (error) {
    console.error("Add Fee Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get payments for one student
exports.getStudentFeePayments = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID.",
      });
    }

    const studentRecord = await Student.findById(studentId);

    if (!studentRecord) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const payments = await FeePayment.find({
      student: studentId,
    }).sort({
      paymentDate: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("Get Student Fee Payments Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get fee balances for one student
// exports.getStudentFeeSummary = async (req, res) => {
//   try {
//     const { studentId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(studentId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid student ID.",
//       });
//     }

//     const studentRecord = await Student.findById(studentId);

//     if (!studentRecord) {
//       return res.status(404).json({
//         success: false,
//         message: "Student not found.",
//       });
//     }

//     const feeStructures = await FeesStructure.find({
//       className: studentRecord.currentClass,
//     });

//     const payments = await FeePayment.aggregate([
//       {
//         $match: {
//           student: new mongoose.Types.ObjectId(studentId),
//         },
//       },
//       {
//         $group: {
//           _id: "$feeType",
//           totalPaid: { $sum: "$amount" },
//         },
//       },
//     ]);

//     const paidByFeeType = new Map(
//       payments.map((payment) => [
//         payment._id,
//         payment.totalPaid,
//       ])
//     );

//     const summary = feeStructures.map((fee) => {
//       const paid = paidByFeeType.get(fee.feeType) || 0;

//       return {
//         feeType: fee.feeType,
//         totalFee: fee.amount,
//         paidAmount: paid,
//         balance: Math.max(fee.amount - paid, 0),
//       };
//     });

//     return res.status(200).json({
//       success: true,
//       data: summary,
//     });
//   } catch (error) {
//     console.error("Get Student Fee Summary Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// Get fee balances for one student using class and section fee structures
exports.getStudentFeeSummary = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID.",
      });
    }

    const studentRecord = await Student.findById(studentId);

    if (!studentRecord) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const normalizeClassName = (value = "") =>
      String(value).trim().replace(/^class\s+/i, "");

    // Get all fee structures for this student's section.
    const sectionFees = await FeesStructure.find({
      section: studentRecord.section,
    });

    // Keep only fees matching both the student's class and section.
    const feeStructures = sectionFees.filter(
      (fee) =>
        normalizeClassName(fee.className) ===
        normalizeClassName(studentRecord.currentClass)
    );

    // Calculate payments made by this student for each fee type.
    const payments = await FeePayment.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
        },
      },
      {
        $group: {
          _id: "$feeType",
          totalPaid: { $sum: "$amount" },
        },
      },
    ]);

    const paidByFeeType = new Map(
      payments.map((payment) => [
        payment._id,
        payment.totalPaid,
      ])
    );

    const summary = feeStructures.map((fee) => {
      const paidAmount = paidByFeeType.get(fee.feeType) || 0;

      return {
        feeType: fee.feeType,
        totalFee: fee.amount,
        paidAmount,
        balance: Math.max(fee.amount - paidAmount, 0),
      };
    });

    return res.status(200).json({
      success: true,
      student: {
        _id: studentRecord._id,
        firstName: studentRecord.firstName,
        lastName: studentRecord.lastName,
        currentClass: studentRecord.currentClass,
        section: studentRecord.section,
      },
      data: summary,
    });
  } catch (error) {
    console.error("Get Student Fee Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Student: view only their own payment history
exports.getMyStudentFeePayments = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user._id,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile is not linked to this login account.",
      });
    }

    const payments = await FeePayment.find({
      student: student._id,
    }).sort({
      paymentDate: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("Get my payments error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your payment history.",
    });
  }
};


// Student: view only their own fee summary
exports.getMyStudentFeeSummary = async (req, res) => {
  try {
    const studentRecord = await Student.findOne({
      user: req.user._id,
    });

    if (!studentRecord) {
      return res.status(404).json({
        success: false,
        message: "Student profile is not linked to this login account.",
      });
    }

    const normalizeClassName = (value = "") =>
      String(value).trim().replace(/^class\s+/i, "").toLowerCase();

    const sectionFees = await FeesStructure.find({
      section: studentRecord.section,
    });

    const feeStructures = sectionFees.filter(
      (fee) =>
        normalizeClassName(fee.className) ===
        normalizeClassName(studentRecord.currentClass)
    );

    const payments = await FeePayment.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentRecord._id),
        },
      },
      {
        $group: {
          _id: "$feeType",
          totalPaid: { $sum: "$amount" },
        },
      },
    ]);

    const paidByFeeType = new Map(
      payments.map((payment) => [
        payment._id,
        payment.totalPaid,
      ])
    );

    const summary = feeStructures.map((fee) => {
      const paidAmount = paidByFeeType.get(fee.feeType) || 0;

      return {
        feeType: fee.feeType,
        totalFee: fee.amount,
        paidAmount,
        balance: Math.max(fee.amount - paidAmount, 0),
      };
    });

    return res.status(200).json({
      success: true,
      student: {
        _id: studentRecord._id,
        firstName: studentRecord.firstName,
        lastName: studentRecord.lastName,
        currentClass: studentRecord.currentClass,
        section: studentRecord.section,
      },
      data: summary,
    });
  } catch (error) {
    console.error("Get my fee summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your fee summary.",
    });
  }
};
