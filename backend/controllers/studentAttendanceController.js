
const StudentAttendance = require("../models/StudentAttendance");
const Student = require("../models/Student");
const Subject = require("../models/Subject");

// Get classes and sections assigned to a teacher
const getTeacherAssignments = async (teacherId) => {
  const subjects = await Subject.find({
    "subjects.teacherUser": teacherId,
  }).select("className section subjects");

  const assignments = [];

  subjects.forEach((subject) => {
    const hasAssignedSubject = subject.subjects.some(
      (item) => String(item.teacherUser) === String(teacherId)
    );

    if (hasAssignedSubject) {
      const exists = assignments.some(
        (item) =>
          String(item.className) === String(subject.className) &&
          String(item.section) === String(subject.section)
      );

      if (!exists) {
        assignments.push({
          className: subject.className,
          section: subject.section,
        });
      }
    }
  });

  return assignments;
};

// Validate dates strictly
const isValidDate = (date) => {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date
  );
};

// Add or update student attendance
exports.saveStudentAttendance = async (req, res) => {
  try {
    const {
      studentId,
      date,
      className,
      section,
      status,
    } = req.body;

    if (!studentId || !date || !className || !section || !status) {
      return res.status(400).json({
        success: false,
        message: "Please provide all attendance details.",
      });
    }

    if (!["Present", "Absent", "Leave"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance status.",
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance date.",
      });
    }

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    if (
      String(student.currentClass) !== String(className) ||
      String(student.section) !== String(section)
    ) {
      return res.status(400).json({
        success: false,
        message: "Student does not belong to this class and section.",
      });
    }
    // Teachers can mark attendance only for their assigned classes
if (String(req.user.role).toLowerCase() === "teacher") {
  const assignments = await getTeacherAssignments(req.user._id);

  const isAssigned = assignments.some(
    (item) =>
      String(item.className) === String(student.currentClass) &&
      String(item.section) === String(student.section)
  );

  if (!isAssigned) {
    return res.status(403).json({
      success: false,
      message: "You are not assigned to this student's class.",
    });
  }
}

    const record = await StudentAttendance.findOneAndUpdate(
      { student: studentId, date },
      {
        student: studentId,
        date,
        className,
        section,
        status,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Student attendance saved successfully.",
      data: record,
    });
  } catch (error) {
    console.error("Save student attendance error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to save attendance.",
    });
  }
};

// Get attendance by date, class and section

exports.getStudentAttendanceByDate = async (req, res) => {
  try {
    const { date, from, to, className, section } = req.query;

    const filter = {};

    // Support either one date or a date range
    // Support either one date or a date range
if (date) {
  if (!isValidDate(date)) {
    return res.status(400).json({
      success: false,
      message: "Invalid date. Use YYYY-MM-DD format.",
    });
  }

  filter.date = date;
} else if (from && to) {
  if (!isValidDate(from) || !isValidDate(to) || from > to) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid date range.",
    });
  }

  filter.date = {
    $gte: from,
    $lte: to,
  };
} else {
  return res.status(400).json({
    success: false,
    message: "Please provide a date or both from and to dates.",
  });
}
    if (from && !to) {
      return res.status(400).json({
        success: false,
        message: "Please provide the To date.",
      });
    }

    if (to && !from) {
      return res.status(400).json({
        success: false,
        message: "Please provide the From date.",
      });
    }

    if (className) {
      filter.className = className;
    }

    if (section) {
      filter.section = section;
    }
    // Teachers can view attendance only for their assigned classes
if (String(req.user.role).toLowerCase() === "teacher") {
  const assignments = await getTeacherAssignments(req.user._id);

  if (assignments.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: [],
    });
  }

  filter.$or = assignments;
}
    const records = await StudentAttendance.find(filter)
      .populate(
        "student",
        "studentId firstName middleName lastName rollNumber currentClass section"
      )
      .sort({ date: 1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("Get student attendance error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to load attendance.",
    });
  }
};

// Get attendance only for the logged-in student
exports.getMyStudentAttendance = async (req, res) => {
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

    const records = await StudentAttendance.find({
      student: student._id,
    }).sort({
      date: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("Get my attendance error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your attendance.",
    });
  }
};

