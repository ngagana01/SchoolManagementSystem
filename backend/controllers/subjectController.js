// const Subject = require("../models/Subject");

// exports.addSubject = async (req, res) => {
//   try {
//     console.log(req.body);

//     const subject = await Subject.create(req.body);

//     res.status(201).json({
//       success: true,
//       data: subject,
//     });

//   } catch (error) {

//     console.log(error);

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });

//   }
// };

// exports.getSubjects = async (req, res) => {
//   try {

//     const subjects = await Subject.find();

//     res.status(200).json({
//       success: true,
//       data: subjects,
//     });

//   } catch (error) {

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });

//   }
// };
// exports.deleteSubject = async (req, res) => {
//   try {

//     const subject =
//       await Subject.findByIdAndDelete(
//         req.params.id
//       );

//     if (!subject) {
//       return res.status(404).json({
//         success: false,
//         message: "Subject not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Subject deleted successfully",
//     });

//   } catch (error) {

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });

//   }
// };
// exports.getSingleSubject = async (req, res) => {
//   try {

//     const subject =
//       await Subject.findById(req.params.id);

//     if (!subject) {
//       return res.status(404).json({
//         success: false,
//         message: "Subject not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: subject,
//     });

//   } catch (error) {

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });

//   }
// };
// exports.updateSubject =
//   async (req, res) => {
//     try {
//       const subject =
//         await Subject.findByIdAndUpdate(
//           req.params.id,
//           req.body,
//           {
//             new: true,
//           }
//         );

//       res.status(200).json({
//         success: true,
//         data: subject,
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message:
//           error.message,
//       });
//     }
//   };


const Subject = require("../models/Subject");
const Employee = require("../models/Employee");
const User = require("../models/User");
const mongoose = require("mongoose");

// ========================================
// GET TEACHERS WHO HAVE LOGIN ACCOUNTS
// ========================================
exports.getAvailableTeachers = async (req, res) => {
  try {
    const employees = await Employee.find({
      user: { $ne: null },
      role: { $regex: /^teacher$/i },
    })
      .populate("user", "name email role")
      .sort({ name: 1 });

    const teachers = employees
      .filter(
        (employee) =>
          employee.user &&
          employee.user.role === "teacher"
      )
      .map((employee) => ({
        employeeId: employee._id,
        userId: employee.user._id,
        name: employee.name,
        email: employee.user.email,
      }));

    return res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers,
    });
  } catch (error) {
    console.error("Get Available Teachers Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// ADD SUBJECT
// ========================================
exports.addSubject = async (req, res) => {
  try {
    const { className, section, subjects } = req.body;

    if (!className || !section || !Array.isArray(subjects) || !subjects.length) {
      return res.status(400).json({
        success: false,
        message: "Class, section and at least one subject are required",
      });
    }

    const validatedSubjects = [];

    for (const item of subjects) {
      const subjectName = String(item.subjectName || "").trim();
      const subjectTeacher = String(item.subjectTeacher || "").trim();
      const marks = Number(item.marks);

      if (!subjectName || !subjectTeacher || ![50, 100].includes(marks)) {
        return res.status(400).json({
          success: false,
          message: "Please provide valid subject details",
        });
      }

      let teacherUser = null;

      if (item.teacherUser) {
        if (!mongoose.Types.ObjectId.isValid(item.teacherUser)) {
          return res.status(400).json({
            success: false,
            message: `Invalid teacher account for ${subjectName}`,
          });
        }

        const teacher = await User.findOne({
          _id: item.teacherUser,
          role: "teacher",
        });

        if (!teacher) {
          return res.status(400).json({
            success: false,
            message: `Selected teacher account is invalid for ${subjectName}`,
          });
        }

        const employee = await Employee.findOne({
          user: teacher._id,
          role: { $regex: /^teacher$/i },
        });

        if (!employee) {
          return res.status(400).json({
            success: false,
            message: `No matching teacher employee record found for ${subjectName}`,
          });
        }

        teacherUser = teacher._id;
      }

      validatedSubjects.push({
        subjectName,
        subjectTeacher,
        teacherUser,
        marks,
      });
    }

    const subject = await Subject.create({
      className: String(className).trim(),
      section: String(section).trim(),
      subjects: validatedSubjects,
    });

    return res.status(201).json({
      success: true,
      message: "Subjects assigned successfully",
      data: subject,
    });
  } catch (error) {
    console.error("Add Subject Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// GET SUBJECTS
// ========================================
exports.getSubjects = async (req, res) => {
  try {
    let filter = {};

    // Teachers see only their assigned subjects.
    if (req.user.role === "teacher") {
      filter = {
        "subjects.teacherUser": req.user._id,
      };
    }

    const subjects = await Subject.find(filter);

    // Remove other teachers' subjects from a teacher's class document.
    const result =
      req.user.role === "teacher"
        ? subjects.map((item) => {
            const data = item.toObject();

            data.subjects = data.subjects.filter(
              (subject) =>
                subject.teacherUser &&
                subject.teacherUser.toString() ===
                  req.user._id.toString()
            );

            return data;
          })
        : subjects;

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Get Subjects Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// GET SINGLE SUBJECT DOCUMENT
// ========================================
exports.getSingleSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    if (req.user.role === "teacher") {
      const ownSubjects = subject.subjects.filter(
        (item) =>
          item.teacherUser &&
          item.teacherUser.toString() ===
            req.user._id.toString()
      );

      if (!ownSubjects.length) {
        return res.status(403).json({
          success: false,
          message: "You cannot access another teacher's subjects",
        });
      }

      const data = subject.toObject();
      data.subjects = ownSubjects;

      return res.status(200).json({
        success: true,
        data,
      });
    }

    return res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    console.error("Get Single Subject Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// UPDATE SUBJECT - ADMIN ONLY
// ========================================
exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    const { className, section, subjects } = req.body;

    if (!className || !section || !Array.isArray(subjects) || !subjects.length) {
      return res.status(400).json({
        success: false,
        message: "Class, section and at least one subject are required",
      });
    }

    const validatedSubjects = [];

    for (const item of subjects) {
      const subjectName = String(item.subjectName || "").trim();
      const subjectTeacher = String(item.subjectTeacher || "").trim();
      const marks = Number(item.marks);

      if (!subjectName || !subjectTeacher || ![50, 100].includes(marks)) {
        return res.status(400).json({
          success: false,
          message: "Please provide valid subject details",
        });
      }

      let teacherUser = null;

      if (item.teacherUser) {
        if (!mongoose.Types.ObjectId.isValid(item.teacherUser)) {
          return res.status(400).json({
            success: false,
            message: `Invalid teacher account for ${subjectName}`,
          });
        }

        const teacher = await User.findOne({
          _id: item.teacherUser,
          role: "teacher",
        });

        if (!teacher) {
          return res.status(400).json({
            success: false,
            message: `Invalid teacher account for ${subjectName}`,
          });
        }

        const employee = await Employee.findOne({
          user: teacher._id,
          role: { $regex: /^teacher$/i },
        });

        if (!employee) {
          return res.status(400).json({
            success: false,
            message: `No matching teacher employee record found for ${subjectName}`,
          });
        }

        teacherUser = teacher._id;
      }

      validatedSubjects.push({
        subjectName,
        subjectTeacher,
        teacherUser,
        marks,
      });
    }

    subject.className = String(className).trim();
    subject.section = String(section).trim();
    subject.subjects = validatedSubjects;

    await subject.save();

    return res.status(200).json({
      success: true,
      message: "Subjects updated successfully",
      data: subject,
    });
  } catch (error) {
    console.error("Update Subject Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// DELETE SUBJECT - ADMIN ONLY
// ========================================
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error("Delete Subject Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
