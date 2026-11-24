
const Exam = require("../models/Exam");

// =====================================
// CREATE EXAM
// Admin only
// =====================================
exports.createExam = async (req, res) => {
  try {
    const {
      examName,
      examType,
      academicYear,
      className,
      section,
      startDate,
      endDate,
      description,
    } = req.body;

    if (
      !examName ||
      !examType ||
      !academicYear ||
      !className ||
      !section ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date.",
      });
    }

    const exam = await Exam.create({
      examName,
      examType,
      academicYear,
      className,
      section,
      startDate,
      endDate,
      description,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Exam created successfully.",
      data: exam,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An exam with this name already exists for this class, section and academic year.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================
// GET ALL EXAMS
// =====================================
exports.getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate("createdBy", "name email")
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      count: exams.length,
      data: exams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================
// GET SINGLE EXAM
// =====================================
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate("createdBy", "name email");

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================
// UPDATE EXAM
// Admin only
// =====================================
exports.updateExam = async (req, res) => {
  try {
    const {
      examName,
      examType,
      academicYear,
      className,
      section,
      startDate,
      endDate,
      description,
    } = req.body;

    if (
      startDate &&
      endDate &&
      new Date(endDate) < new Date(startDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date.",
      });
    }

    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      {
        examName,
        examType,
        academicYear,
        className,
        section,
        startDate,
        endDate,
        description,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Exam updated successfully.",
      data: exam,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An exam with this name already exists for this class, section and academic year.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================
// DELETE EXAM
// Admin only
// =====================================
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Exam deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
