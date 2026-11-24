const mongoose = require("mongoose");
const Student = require("../models/Student");
const StudentFeeAssignment = require("../models/StudentFeeAssignment");
const FeesStructure = require("../models/FeesStructure");

// Create a fee assignment for an individual student
const createStudentFeeAssignment = async (req, res) => {
  try {
    const {
      student,
      academicYear,
      feeType,
      discountAmount,
      discountReason,
      dueDate,
    } = req.body;

    // 1. Validate required fields
    if (!student || !academicYear || !feeType) {
      return res.status(400).json({
        success: false,
        message: "Student, academic year, and fee type are required.",
      });
    }

    // 2. Validate student ID
    if (!mongoose.Types.ObjectId.isValid(student)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID.",
      });
    }

    // 3. Find the student
    const studentRecord = await Student.findById(student);

    if (!studentRecord) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    // 4. Validate fee type
    const allowedFeeTypes = [
      "Tuition Fee",
      "Exam Fee",
      "Transport Fee",
    ];

    if (!allowedFeeTypes.includes(feeType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid fee type.",
      });
    }

    // 5. Get the student's class and section
    const studentClass = String(
      studentRecord.currentClass || ""
    ).trim();

    const studentSection = String(
      studentRecord.section || ""
    ).trim();

    if (!studentClass || !studentSection) {
      return res.status(400).json({
        success: false,
        message: "The student must have a class and section assigned.",
      });
    }

    // Normalize class names such as "Class 5" and "5"
    const normalizeClassName = (value) =>
      String(value || "")
        .trim()
        .replace(/^class\s+/i, "")
        .trim()
        .toLowerCase();

    // 6. Find the matching fee structure
    const allClassFees = await FeesStructure.find({
      section: studentSection,
      feeType,
    });

    const matchingFee = allClassFees.find(
      (fee) =>
        normalizeClassName(fee.className) ===
        normalizeClassName(studentClass)
    );

    if (!matchingFee) {
      return res.status(404).json({
        success: false,
        message: `No ${feeType} structure exists for Class ${studentClass}, Section ${studentSection}.`,
      });
    }

    // The standard fee comes from MongoDB, not the frontend.
    const standard = Number(matchingFee.amount);

    // 7. Validate discount
    const discount =
      discountAmount === undefined || discountAmount === ""
        ? 0
        : Number(discountAmount);

    if (!Number.isFinite(discount) || discount < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount must be a valid, non-negative number.",
      });
    }

    if (discount > standard) {
      return res.status(400).json({
        success: false,
        message: "Discount cannot be greater than the standard fee.",
      });
    }

    // 8. Calculate the final fee
    const finalAmount = standard - discount;

    // 9. Validate academic year
    const year = String(academicYear).trim();

    if (!year) {
      return res.status(400).json({
        success: false,
        message: "Academic year is required.",
      });
    }

    // 10. Check for an existing assignment
    const existingAssignment =
      await StudentFeeAssignment.findOne({
        student,
        academicYear: year,
        feeType,
      });

    if (existingAssignment) {
      return res.status(409).json({
        success: false,
        message:
          "This fee has already been assigned to the student for this academic year.",
      });
    }

    // 11. Create the assignment
    const assignment = await StudentFeeAssignment.create({
      student,
      academicYear: year,
      feeType,
      standardAmount: standard,
      discountAmount: discount,
      finalAmount,
      discountReason: discountReason || "",
      dueDate: dueDate || undefined,
    });

    return res.status(201).json({
      success: true,
      message: "Student fee assigned successfully.",
      data: assignment,
    });
  } catch (error) {
    console.error("Create student fee assignment error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This fee has already been assigned to the student for that academic year.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to assign fee.",
      error: error.message,
    });
  }
};

// Get all fee assignments for a student
const getStudentFeeAssignments = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear } = req.query;

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

    const filter = {
      student: studentId,
      status: "Active",
    };

    if (academicYear) {
      filter.academicYear = academicYear;
    }

    const assignments = await StudentFeeAssignment.find(filter)
      .sort({ feeType: 1 })
      .populate(
        "student",
        "studentId firstName middleName lastName currentClass section"
      );

    return res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    console.error("Get student fee assignments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve student fee assignments.",
      error: error.message,
    });
  }
};

// Student: view only their own fee assignments
const getMyStudentFeeAssignments = async (req, res) => {
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

    const filter = {
      student: student._id,
      status: "Active",
    };

    if (req.query.academicYear) {
      filter.academicYear = req.query.academicYear;
    }

    const assignments = await StudentFeeAssignment.find(filter)
      .sort({ feeType: 1 });

    return res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    console.error("Get my fee assignments error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your fee assignments.",
    });
  }
};


module.exports = {
  createStudentFeeAssignment,
  getStudentFeeAssignments,
  getMyStudentFeeAssignments,
};