
const mongoose = require("mongoose");
const TimeTable = require("../models/TimeTable");
const TimeSlot = require("../models/TimeSlot");
const Subject = require("../models/Subject");
const Student = require("../models/Student");

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const normalizeClass = (value) =>
  String(value || "")
    .trim()
    .replace(/^class\s+/i, "")
    .toLowerCase();

const findClassSubjects = async (className, section) => {
  const documents = await Subject.find({
    section: String(section).trim(),
  });

  const assignment = documents.find(
    (doc) =>
      normalizeClass(doc.className) === normalizeClass(className)
  );

  return assignment ? assignment.subjects : [];
};

// GET /api/time-tables/subjects?className=5&section=A
exports.getSubjectsForClass = async (req, res) => {
  try {
    const { className, section } = req.query;

    if (!className || !section) {
      return res.status(400).json({
        success: false,
        message: "className and section are required.",
      });
    }

    const subjects = await findClassSubjects(className, section);

    return res.status(200).json({
      success: true,
      data: subjects.map((subject) => ({
        _id: subject._id,
        subjectName: subject.subjectName,
        subjectTeacher: subject.subjectTeacher,
        marks: subject.marks,
      })),
    });
  } catch (error) {
    console.error("Get assigned subjects error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load assigned subjects.",
    });
  }
};

// GET /api/time-tables?className=5&section=A
exports.getTimeTable = async (req, res) => {
  try {
    const { className, section } = req.query;

    if (!className || !section) {
      return res.status(400).json({
        success: false,
        message: "className and section are required.",
      });
    }

    const timetable = await TimeTable.findOne({
      className: String(className).trim(),
      section: String(section).trim(),
    }).populate("entries.timeSlot", "period startTime endTime");

    return res.status(200).json({
      success: true,
      data: timetable,
    });
  } catch (error) {
    console.error("Get timetable error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load timetable.",
    });
  }
};

/* =========================================
   GET TEACHER'S ASSIGNED CLASSES
   GET /api/time-tables/my-teacher-classes
========================================= */

exports.getMyTeacherClasses = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Find subject documents where this teacher
    // is assigned to at least one subject.
    const documents = await Subject.find({
      "subjects.teacherUser": teacherId,
    }).select("className section subjects");

    const assignments = [];

    documents.forEach((doc) => {
      const hasAssignedSubject = doc.subjects.some(
        (subject) =>
          subject.teacherUser &&
          String(subject.teacherUser) === String(teacherId)
      );

      if (!hasAssignedSubject) return;

      const exists = assignments.some(
        (item) =>
          normalizeClass(item.className) ===
            normalizeClass(doc.className) &&
          String(item.section).trim().toLowerCase() ===
            String(doc.section).trim().toLowerCase()
      );

      if (!exists) {
        assignments.push({
          className: doc.className,
          section: doc.section,
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error("Get teacher assigned classes error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your assigned classes.",
    });
  }
};


/* =========================================
   GET TEACHER'S ASSIGNED CLASS TIMETABLE
   GET /api/time-tables/my-teacher
========================================= */

exports.getMyTeacherTimeTable = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { className, section } = req.query;

    if (!className || !section) {
      return res.status(400).json({
        success: false,
        message: "className and section are required.",
      });
    }

    // Check whether this teacher is assigned
    // to at least one subject in this class and section.
    const subjectDocument = await Subject.findOne({
      className: String(className).trim(),
      section: String(section).trim(),
      "subjects.teacherUser": teacherId,
    });

    if (!subjectDocument) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this class and section.",
      });
    }

    const hasAssignedSubject = subjectDocument.subjects.some(
      (subject) =>
        subject.teacherUser &&
        String(subject.teacherUser) === String(teacherId)
    );

    if (!hasAssignedSubject) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this class and section.",
      });
    }

    // Load the class's complete timetable.
    const timetable = await TimeTable.findOne({
      className: String(className).trim(),
      section: String(section).trim(),
    }).populate("entries.timeSlot", "period startTime endTime");

    // Load all subjects so the complete timetable
    // can display the subject names.
    const subjects = await findClassSubjects(className, section);

    return res.status(200).json({
      success: true,
      teacher: {
        name: req.user.name,
      },
      classDetails: {
        className,
        section,
      },
      data: timetable,
      subjects: subjects.map((subject) => ({
        _id: subject._id,
        subjectName: subject.subjectName,
        subjectTeacher: subject.subjectTeacher,
        marks: subject.marks,
      })),
    });
  } catch (error) {
    console.error("Get teacher timetable error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your assigned timetable.",
    });
  }
};


// POST /api/time-tables
exports.saveTimeTable = async (req, res) => {
  try {
    const { className, section, entries } = req.body;

    if (
      !className ||
      !section ||
      !Array.isArray(entries)
    ) {
      return res.status(400).json({
        success: false,
        message: "className, section and entries are required.",
      });
    }

    const validEntries = [];

    for (const entry of entries) {
      if (
        !DAYS.includes(entry.day) ||
        !mongoose.isValidObjectId(entry.timeSlot) ||
        !mongoose.isValidObjectId(entry.subject)
      ) {
        return res.status(400).json({
          success: false,
          message: "One or more timetable entries are invalid.",
        });
      }

      validEntries.push({
        day: entry.day,
        timeSlot: entry.timeSlot,
        subject: entry.subject,
      });
    }

    const uniqueCells = new Set(
      validEntries.map(
        (entry) => `${entry.day}-${entry.timeSlot}`
      )
    );

    if (uniqueCells.size !== validEntries.length) {
      return res.status(400).json({
        success: false,
        message: "A day and time slot can only have one subject.",
      });
    }

    const timeSlotIds = [
      ...new Set(validEntries.map((entry) => String(entry.timeSlot))),
    ];

    const existingSlots = await TimeSlot.find({
      _id: { $in: timeSlotIds },
    }).select("_id");

    if (existingSlots.length !== timeSlotIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more selected time slots do not exist.",
      });
    }

    // Check selected subject IDs against this class and section.
    const assignedSubjects = await findClassSubjects(
      className,
      section
    );

    const allowedSubjectIds = new Set(
      assignedSubjects.map((subject) => String(subject._id))
    );

    const invalidSubject = validEntries.some(
      (entry) => !allowedSubjectIds.has(String(entry.subject))
    );

    if (invalidSubject) {
      return res.status(400).json({
        success: false,
        message:
          "A selected subject is not assigned to this class and section.",
      });
    }

    const timetable = await TimeTable.findOneAndUpdate(
      {
        className: String(className).trim(),
        section: String(section).trim(),
      },
      {
        $set: {
          className: String(className).trim(),
          section: String(section).trim(),
          entries: validEntries,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Timetable saved successfully.",
      data: timetable,
    });
  } catch (error) {
    console.error("Save timetable error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to save timetable.",
    });
  }
};

// GET /api/time-tables/my
// Student can view only their own class timetable.
exports.getMyTimeTable = async (req, res) => {
  try {
    // Find the Student record linked to the logged-in User.
    const student = await Student.findOne({
      user: req.user._id,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Your student profile is not linked to your login account.",
      });
    }

    if (!student.currentClass || !student.section) {
      return res.status(400).json({
        success: false,
        message: "Your class or section has not been assigned.",
      });
    }

    // Find timetable using the student's own class and section.
    const timetable = await TimeTable.findOne({
      className: String(student.currentClass).trim(),
      section: String(student.section).trim(),
    }).populate("entries.timeSlot", "period startTime endTime");

    // Find subjects assigned to the student's class and section.
    const subjects = await findClassSubjects(
      student.currentClass,
      student.section
    );

    return res.status(200).json({
      success: true,
      student: {
        firstName: student.firstName,
        lastName: student.lastName,
        currentClass: student.currentClass,
        section: student.section,
      },
      data: timetable,
      subjects: subjects.map((subject) => ({
        _id: subject._id,
        subjectName: subject.subjectName,
        subjectTeacher: subject.subjectTeacher,
        marks: subject.marks,
      })),
    });
  } catch (error) {
    console.error("Get my timetable error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your timetable.",
    });
  }
};
