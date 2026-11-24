
const mongoose = require("mongoose");

const StudentMarks = require("../models/StudentMarks");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Exam = require("../models/Exam");
// ==========================================
// HELPER: Check teacher's subject assignment
// ==========================================

const checkTeacherAssignment = async (
  teacherId,
  className,
  section,
  subjectName
) => {
  const assignment = await Subject.findOne({
    className,
    section,
    subjects: {
      $elemMatch: {
        subjectName,
        teacherUser: teacherId,
      },
    },
  });

  if (!assignment) {
    return null;
  }

  const assignedSubject = assignment.subjects.find(
    (subject) =>
      subject.subjectName === subjectName &&
      subject.teacherUser?.toString() === teacherId.toString()
  );

  return assignedSubject || null;
};

// ==========================================
// 1. GET STUDENTS FOR MARKS ENTRY
// ==========================================

exports.getStudentsForMarks = async (req, res) => {
  try {
    const { className, section, subjectName } = req.query;

    if (!className || !section || !subjectName) {
      return res.status(400).json({
        success: false,
        message: "Class, section and subject are required",
      });
    }

    const subject = await checkTeacherAssignment(
      req.user._id,
      className,
      section,
      subjectName
    );

    if (!subject) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this subject and class",
      });
    }

    const students = await Student.find({
      currentClass: className,
      section,
    })
      .select(
        "studentId firstName middleName lastName currentClass section academicYear rollNumber"
      )
      .sort({ rollNumber: 1, firstName: 1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      maxMarks: subject.marks,
      data: students,
    });
  } catch (error) {
    console.error("Get students for marks error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// 2. ENTER OR UPDATE STUDENT MARKS
// ==========================================

exports.saveStudentMarks = async (req, res) => {
  try {
    const {
      studentId,
      subjectName,
      examName,
      obtainedMarks,
      remarks,
    } = req.body;

    if (
      !studentId ||
      !subjectName ||
      !examName ||
      obtainedMarks === undefined ||
      obtainedMarks === null
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required marks details",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const subject = await checkTeacherAssignment(
      req.user._id,
      student.currentClass,
      student.section,
      subjectName
    );

    if (!subject) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this student's subject",
      });
    }

    const marks = Number(obtainedMarks);
    const maxMarks = Number(subject.marks);

    if (
      !Number.isFinite(marks) ||
      marks < 0 ||
      marks > maxMarks
    ) {
      return res.status(400).json({
        success: false,
        message: `Marks must be between 0 and ${maxMarks}`,
      });
    }

    const academicYear = student.academicYear || "Not specified";
    // Verify that the selected examination exists
// for this student's class, section and academic year.

const selectedExam = await Exam.findOne({
  examName: examName.trim(),
  className: student.currentClass,
  section: student.section,
  academicYear,
});

if (!selectedExam) {
  return res.status(400).json({
    success: false,
    message:
      "The selected examination is not available for this student's class, section and academic year.",
  });
}

    const existingMarks = await StudentMarks.findOne({
      student: student._id,
      subjectName,
      examName: examName.trim(),
      academicYear,
    });

    if (
      existingMarks &&
      existingMarks.teacher.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot update marks entered by another teacher",
      });
    }

    let savedMarks;

    if (existingMarks) {
      existingMarks.obtainedMarks = marks;
      existingMarks.remarks = remarks || "";
      existingMarks.maxMarks = maxMarks;

      // Updated marks must be published again.
      existingMarks.isPublished = false;
      existingMarks.publishedAt = null;

      savedMarks = await existingMarks.save();
    } else {
      savedMarks = await StudentMarks.create({
        student: student._id,
        teacher: req.user._id,
        className: student.currentClass,
        section: student.section,
        academicYear,
        subjectName,
        examName: examName.trim(),
        maxMarks,
        obtainedMarks: marks,
        remarks: remarks || "",
        isPublished: false,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student marks saved successfully",
      data: savedMarks,
    });
  } catch (error) {
    console.error("Save student marks error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// 3. GET MARKS FOR TEACHER
// ==========================================

exports.getTeacherMarks = async (req, res) => {
  try {
    const { className, section, subjectName, examName } = req.query;

    const filter = {
      teacher: req.user._id,
    };

    if (className) filter.className = className;
    if (section) filter.section = section;
    if (subjectName) filter.subjectName = subjectName;
    if (examName) filter.examName = examName;

    const marks = await StudentMarks.find(filter)
      .populate(
        "student",
        "studentId firstName middleName lastName rollNumber currentClass section"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: marks.length,
      data: marks,
    });
  } catch (error) {
    console.error("Get teacher marks error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// 4. PUBLISH STUDENT MARKS
// ==========================================

exports.publishStudentMarks = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid marks ID",
      });
    }

    const marks = await StudentMarks.findById(id);

    if (!marks) {
      return res.status(404).json({
        success: false,
        message: "Marks record not found",
      });
    }

    if (marks.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot publish another teacher's marks",
      });
    }

    // Verify that the teacher still owns this subject assignment.
    const subject = await checkTeacherAssignment(
      req.user._id,
      marks.className,
      marks.section,
      marks.subjectName
    );

    if (!subject) {
      return res.status(403).json({
        success: false,
        message: "You are no longer assigned to this subject",
      });
    }

    marks.isPublished = true;
    marks.publishedAt = new Date();

    await marks.save();

    return res.status(200).json({
      success: true,
      message: "Student marks published successfully",
      data: marks,
    });
  } catch (error) {
    console.error("Publish student marks error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// 5. GET LOGGED-IN STUDENT'S PUBLISHED MARKS
// ==========================================

exports.getMyMarks = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user._id,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student account is not linked to a student record",
      });
    }

    const marks = await StudentMarks.find({
      student: student._id,
      isPublished: true,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: marks.length,
      data: marks,
    });
  } catch (error) {
    console.error("Get my marks error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
