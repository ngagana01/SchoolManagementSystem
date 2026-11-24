const mongoose = require("mongoose");
const Student = require("../models/Student");
const FeesStructure = require("../models/FeesStructure");
const StudentFeeAssignment = require("../models/StudentFeeAssignment");
const FeePayment = require("../models/FeePayment");

// Normalize class names such as "Class 5" and "5".
const normalizeClassName = (value = "") =>
  String(value).trim().replace(/^class\s+/i, "").trim().toLowerCase();

// Get fee collection report
exports.getFeeCollectionReport = async (req, res) => {
  try {
    const {
      academicYear,
      className,
      section,
      feeType,
      startDate,
      endDate,
    } = req.query;

    // Validate date filters.
    const dateFilter = {};

    if (startDate || endDate) {
      dateFilter.paymentDate = {};

      if (startDate) {
        const start = new Date(`${startDate}T00:00:00.000Z`);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date.",
          });
        }

        dateFilter.paymentDate.$gte = start;
      }

      if (endDate) {
        const end = new Date(`${endDate}T23:59:59.999Z`);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date.",
          });
        }

        dateFilter.paymentDate.$lte = end;
      }

      if (
        startDate &&
        endDate &&
        new Date(startDate) > new Date(endDate)
      ) {
        return res.status(400).json({
          success: false,
          message: "Start date cannot be after end date.",
        });
      }
    }

    // Filter students by class and section.
    const studentFilter = {};

    if (section) {
      studentFilter.section = section;
    }

    let students = await Student.find(studentFilter).lean();

    if (className) {
      students = students.filter(
        (student) =>
          normalizeClassName(student.currentClass) ===
          normalizeClassName(className)
      );
    }

    const studentIds = students.map((student) => student._id);

    // Load fee structures and assignments.
    const [allFeeStructures, allAssignments, allPayments] =
      await Promise.all([
        FeesStructure.find().lean(),

        StudentFeeAssignment.find({
          status: "Active",
          ...(academicYear ? { academicYear } : {}),
          student: { $in: studentIds },
        }).lean(),

        FeePayment.find({
          student: { $in: studentIds },
          ...dateFilter,
          ...(feeType ? { feeType } : {}),
        })
          .sort({ paymentDate: -1, createdAt: -1 })
          .lean(),
      ]);

    // Keep only fee structures matching each student's class and section.
    const reportRows = students.map((student) => {
      const studentFees = allFeeStructures.filter(
        (fee) =>
          normalizeClassName(fee.className) ===
            normalizeClassName(student.currentClass) &&
          String(fee.section || "").trim().toLowerCase() ===
            String(student.section || "").trim().toLowerCase() &&
          (!feeType || fee.feeType === feeType)
      );

      const studentAssignments = allAssignments.filter(
        (assignment) =>
          String(assignment.student) === String(student._id) &&
          (!feeType || assignment.feeType === feeType)
      );

      const studentPayments = allPayments.filter(
        (payment) =>
          String(payment.student) === String(student._id)
      );

      // Calculate each fee type separately.
      const feeTypes = new Set([
        ...studentFees.map((fee) => fee.feeType),
        ...studentAssignments.map((assignment) => assignment.feeType),
      ]);

      let totalStandardFee = 0;
      let totalDiscount = 0;
      let totalExpectedFee = 0;
      let totalPaid = 0;

      const feeBreakdown = [];

      for (const type of feeTypes) {
        const structure = studentFees.find(
          (fee) => fee.feeType === type
        );

        const assignment = studentAssignments.find(
          (item) => item.feeType === type
        );

        const standardAmount = Number(
          assignment?.standardAmount ??
            structure?.amount ??
            0
        );

        const discountAmount = Number(
          assignment?.discountAmount || 0
        );

        const expectedAmount = Number(
          assignment?.finalAmount ??
            Math.max(standardAmount - discountAmount, 0)
        );

        const paidAmount = studentPayments
          .filter((payment) => payment.feeType === type)
          .reduce(
            (sum, payment) => sum + Number(payment.amount || 0),
            0
          );

        const balance = Math.max(expectedAmount - paidAmount, 0);

        totalStandardFee += standardAmount;
        totalDiscount += discountAmount;
        totalExpectedFee += expectedAmount;
        totalPaid += paidAmount;

        feeBreakdown.push({
          feeType: type,
          standardAmount,
          discountAmount,
          expectedAmount,
          paidAmount,
          balance,
          status:
            balance <= 0
              ? "Paid"
              : paidAmount > 0
                ? "Partial"
                : "Pending",
        });
      }

      const totalBalance = Math.max(
        totalExpectedFee - totalPaid,
        0
      );

      return {
        studentId: student._id,
        admissionNumber: student.studentId || "",
        studentName: [
          student.firstName,
          student.middleName,
          student.lastName,
        ]
          .filter(Boolean)
          .join(" "),
        className: student.currentClass || "",
        section: student.section || "",
        totalStandardFee,
        totalDiscount,
        totalExpectedFee,
        totalPaid,
        totalBalance,
        status:
          totalBalance <= 0
            ? "Paid"
            : totalPaid > 0
              ? "Partial"
              : "Pending",
        feeBreakdown,
      };
    });

    // Remove students who have no applicable fees.
    const rowsWithFees = reportRows.filter(
      (row) => row.feeBreakdown.length > 0
    );

    // Summary totals.
    const summary = rowsWithFees.reduce(
      (totals, row) => {
        totals.totalExpectedFees += row.totalExpectedFee;
        totals.totalCollected += row.totalPaid;
        totals.totalOutstanding += row.totalBalance;

        if (row.totalBalance > 0) {
          totals.studentsWithPendingFees += 1;
        }

        return totals;
      },
      {
        totalExpectedFees: 0,
        totalCollected: 0,
        totalOutstanding: 0,
        studentsWithPendingFees: 0,
      }
    );

    return res.status(200).json({
      success: true,
      filters: {
        academicYear: academicYear || "All",
        className: className || "All",
        section: section || "All",
        feeType: feeType || "All",
        startDate: startDate || "",
        endDate: endDate || "",
      },
      summary,
      count: rowsWithFees.length,
      data: rowsWithFees,
    });
  } catch (error) {
    console.error("Get Fee Collection Report Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate fee collection report.",
      error: error.message,
    });
  }
};