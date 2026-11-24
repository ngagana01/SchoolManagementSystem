// const Student = require("../models/Student");


// const addStudent = async (req, res) => {
//   try {

//     const student = await Student.create(req.body);

//     res.status(201).json({
//       success: true,
//       message: "Student Added Successfully",
//       data: student,
//     });

//   } catch (error) {

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });

//   }
// };

// const getStudents = async (req, res) => {
//   try {

//     const students = await Student.find();

//     res.status(200).json({
//       success: true,
//       count: students.length,
//       data: students,
//     });

//   } catch (error) {

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });

//   }
// };

// const getStudentById = async (req, res) => {
//   try {

//     const student =
//       await Student.findById(req.params.id);

//     if (!student) {
//       return res.status(404).json({
//         success: false,
//         message: "Student Not Found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: student,
//     });

//   } catch (error) {

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });

//   }
// };
// const updateStudent = async (req, res) => {
//   try {

//     const updatedStudent =
//       await Student.findByIdAndUpdate(
//         req.params.id,
//         req.body,
//         {
//           new: true,
//           runValidators: true,
//         }
//       );

//     if (!updatedStudent) {
//       return res.status(404).json({
//         success: false,
//         message: "Student Not Found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Student Updated Successfully",
//       data: updatedStudent,
//     });

//   } catch (error) {

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });

//   }
// };
// const deleteStudent = async (req, res) => {
//   try {

//     const student =
//       await Student.findByIdAndDelete(
//         req.params.id
//       );

//     if (!student) {
//       return res.status(404).json({
//         success: false,
//         message: "Student Not Found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Student Deleted Successfully",
//     });

//   } catch (error) {

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });

//   }
// };


// module.exports = {
//   addStudent,
//   getStudents,
//   getStudentById,
//   updateStudent,
//   deleteStudent,
// };

const mongoose = require("mongoose");
const Student = require("../models/Student");
const Subject = require("../models/Subject");

// ========================================
// ADD STUDENT - Admin and Teacher
// ========================================
const addStudent = async (req, res) => {
  try {
    const studentData = { ...req.body };

    // Prevent manually linking an arbitrary login account
    delete studentData.user;
    delete studentData._id;

    const student = await Student.create(studentData);

    res.status(201).json({
      success: true,
      message: "Student Added Successfully",
      data: student,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// GET ALL STUDENTS
// Admin, Principal, Teacher, Accountant
// ========================================
// ========================================
// GET STUDENTS
// Teacher sees only assigned classes
// Other permitted roles see all students
// ========================================
const getStudents = async (req, res) => {
  try {
    let students;

    if (String(req.user.role).toLowerCase() === "teacher") {
      const assignments = await getTeacherAssignments(req.user._id);

      if (assignments.length === 0) {
        students = [];
      } else {
        students = await Student.find({
          $or: assignments,
        });
      }
    } else {
      students = await Student.find();
    }

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// GET SINGLE STUDENT
// Admin, Principal, Teacher, Accountant
// ========================================
// ========================================
// GET SINGLE STUDENT
// ========================================
const getStudentById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student Not Found",
      });
    }

    if (String(req.user.role).toLowerCase() === "teacher") {
      const assigned = await isTeacherAssignedToStudent(
        req.user._id,
        student
      );

      if (!assigned) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this student's class.",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// GET LOGGED-IN STUDENT'S OWN PROFILE
// Student only
// ========================================
const getMyStudentProfile = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user._id,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found for this account",
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// UPDATE STUDENT - Admin and Teacher
// ========================================
// ========================================
// UPDATE STUDENT - Admin and assigned Teacher
// ========================================
const updateStudent = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student Not Found",
      });
    }

    if (String(req.user.role).toLowerCase() === "teacher") {
      const assigned = await isTeacherAssignedToStudent(
        req.user._id,
        student
      );

      if (!assigned) {
        return res.status(403).json({
          success: false,
          message: "You cannot update a student outside your assigned classes.",
        });
      }
    }

    const updateData = { ...req.body };

    delete updateData._id;
    delete updateData.user;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    // Teachers cannot transfer students to another class or section
if (String(req.user.role).toLowerCase() === "teacher") {
  delete updateData.currentClass;
  delete updateData.section;
}

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Student Updated Successfully",
      data: updatedStudent,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
// ========================================
// DELETE STUDENT - Admin only
// ========================================
const deleteStudent = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student Not Found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Student Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Get classes and sections assigned to a teacher
const getTeacherAssignments = async (teacherId) => {
  const subjectDocuments = await Subject.find({
    "subjects.teacherUser": teacherId,
  }).select("className section");

  // Remove duplicate class and section combinations
  const uniqueAssignments = new Map();

  subjectDocuments.forEach((item) => {
    const key = `${item.className}-${item.section}`;

    uniqueAssignments.set(key, {
      currentClass: item.className,
      section: item.section,
    });
  });

  return Array.from(uniqueAssignments.values());
};

// Check whether a teacher is assigned to a student's class and section
const isTeacherAssignedToStudent = async (teacherId, student) => {
  const assignments = await getTeacherAssignments(teacherId);

  return assignments.some(
    (item) =>
      String(item.currentClass) === String(student.currentClass) &&
      String(item.section) === String(student.section)
  );
};

module.exports = {
  addStudent,
  getStudents,
  getStudentById,
  getMyStudentProfile,
  updateStudent,
  deleteStudent,
  getTeacherAssignments,
  isTeacherAssignedToStudent,
};
