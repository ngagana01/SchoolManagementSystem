
// const mongoose = require("mongoose");

// const Assignment = require("../models/Assignment");
// const AssignmentSubmission = require("../models/AssignmentSubmission");
// const Student = require("../models/Student");
// const Subject = require("../models/Subject");

// // ========================================
// // CHECK WHETHER TEACHER IS ASSIGNED
// // TO THIS CLASS, SECTION AND SUBJECT
// // ========================================
// const checkTeacherAssignment = async (
//   teacherId,
//   className,
//   section,
//   subjectName
// ) => {
//   return await Subject.findOne({
//     className: String(className).trim(),
//     section: String(section).trim(),
//     subjects: {
//       $elemMatch: {
//         subjectName: String(subjectName).trim(),
//         teacherUser: teacherId,
//       },
//     },
//   });
// };

// // ========================================
// // CREATE ASSIGNMENT - TEACHER
// // ========================================
// exports.createAssignment = async (req, res) => {
//   try {
//     const {
//       title,
//       assignmentType,
//       instructions,
//       className,
//       section,
//       subjectName,
//       academicYear,
//       dueDate,
//       totalMarks,
//       reviewAssignmentSubmission,
//     } = req.body;

//     if (
//       !title ||
//       !assignmentType ||
//       !instructions ||
//       !className ||
//       !section ||
//       !subjectName ||
//       !dueDate
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide all required assignment details",
//       });
//     }

//     const allowedTypes = [
//       "Homework",
//       "Quiz",
//       "Class Test",
//       "Project",
//       "Assignment",
//       "Other",
//     ];

//     if (!allowedTypes.includes(assignmentType)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid assignment type",
//       });
//     }

//     const parsedDueDate = new Date(dueDate);

//     if (Number.isNaN(parsedDueDate.getTime())) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide a valid due date",
//       });
//     }

//     // Verify teacher's subject assignment
//     const assignedSubject = await checkTeacherAssignment(
//       req.user._id,
//       className,
//       section,
//       subjectName
//     );

//     if (!assignedSubject) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not assigned to this class, section and subject",
//       });
//     }

//     const assignment = await Assignment.create({
//       title: String(title).trim(),
//       assignmentType,
//       instructions: String(instructions).trim(),
//       className: String(className).trim(),
//       section: String(section).trim(),
//       subjectName: String(subjectName).trim(),
//       teacher: req.user._id,
//       academicYear: String(academicYear || "").trim(),
//       dueDate: parsedDueDate,
//       attachment: req.file
//         ? `/uploads/${req.file.filename}`
//         : "",
//       isPublished: false,
//       publishedAt: null,
//       totalMarks:
//   totalMarks !== undefined && totalMarks !== ""
//     ? Number(totalMarks)
//     : null,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Assignment created successfully",
//       data: assignment,
//     });
//   } catch (error) {
//     console.error("Create Assignment Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // ========================================
// // GET TEACHER'S ASSIGNMENTS
// // ========================================
// exports.getTeacherAssignments = async (req, res) => {
//   try {
//     const assignments = await Assignment.find({
//       teacher: req.user._id,
//     }).sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       count: assignments.length,
//       data: assignments,
//     });
//   } catch (error) {
//     console.error("Get Teacher Assignments Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // ========================================
// // PUBLISH ASSIGNMENT - TEACHER
// // ========================================
// exports.publishAssignment = async (req, res) => {
//   try {
//     const assignment = await Assignment.findById(req.params.id);

//     if (!assignment) {
//       return res.status(404).json({
//         success: false,
//         message: "Assignment not found",
//       });
//     }

//     if (
//       assignment.teacher.toString() !==
//       req.user._id.toString()
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: "You cannot publish another teacher's assignment",
//       });
//     }

//     // Check that the teacher still has this assignment
//     const assignedSubject = await checkTeacherAssignment(
//       req.user._id,
//       assignment.className,
//       assignment.section,
//       assignment.subjectName
//     );

//     if (!assignedSubject) {
//       return res.status(403).json({
//         success: false,
//         message: "You are no longer assigned to this subject",
//       });
//     }

//     assignment.isPublished = true;
//     assignment.publishedAt = new Date();

//     await assignment.save();

//     return res.status(200).json({
//       success: true,
//       message: "Assignment published successfully",
//       data: assignment,
//     });
//   } catch (error) {
//     console.error("Publish Assignment Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // ========================================
// // GET ASSIGNMENTS FOR LOGGED-IN STUDENT
// // ========================================
// exports.getMyAssignments = async (req, res) => {
//   try {
//     const student = await Student.findOne({
//       user: req.user._id,
//     });

//     if (!student) {
//       return res.status(404).json({
//         success: false,
//         message: "Student account is not linked to a student record",
//       });
//     }

//     const assignments = await Assignment.find({
//       className: String(student.currentClass).trim(),
//       section: String(student.section || "").trim(),
//       isPublished: true,
//     })
//       .populate("teacher", "name email")
//       .sort({ dueDate: 1 });

//     const assignmentIds = assignments.map((item) => item._id);

//     const submissions = await AssignmentSubmission.find({
//       student: student._id,
//       assignment: { $in: assignmentIds },
//     });

//     const submissionMap = new Map(
//       submissions.map((item) => [
//         item.assignment.toString(),
//         item,
//       ])
//     );

//     const result = assignments.map((assignment) => {
//       const data = assignment.toObject();

//       data.mySubmission =
//         submissionMap.get(assignment._id.toString()) || null;

//       return data;
//     });

//     return res.status(200).json({
//       success: true,
//       count: result.length,
//       data: result,
//     });
//   } catch (error) {
//     console.error("Get Student Assignments Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // ========================================
// // SUBMIT ASSIGNMENT - STUDENT
// // ========================================
// exports.submitAssignment = async (req, res) => {
//   try {
//     const { answer } = req.body;

//     const assignment = await Assignment.findById(req.params.id);

//     if (!assignment || !assignment.isPublished) {
//       return res.status(404).json({
//         success: false,
//         message: "Published assignment not found",
//       });
//     }

//     const student = await Student.findOne({
//       user: req.user._id,
//     });

//     if (!student) {
//       return res.status(404).json({
//         success: false,
//         message: "Student account is not linked to a student record",
//       });
//     }

//     // Check student's class and section
//     if (
//       String(student.currentClass).trim() !== assignment.className ||
//       String(student.section || "").trim() !== assignment.section
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: "You cannot submit another class's assignment",
//       });
//     }

//     const existingSubmission = await AssignmentSubmission.findOne({
//       assignment: assignment._id,
//       student: student._id,
//     });

//     if (!String(answer || "").trim() && !req.file && !existingSubmission) {
//       return res.status(400).json({
//         success: false,
//         message: "Please enter an answer or attach a file",
//       });
//     }

//     const now = new Date();

//     const status =
//       now > assignment.dueDate ? "Late" : "Submitted";

//     const updateData = {
//       answer: String(answer || "").trim(),
//       submittedAt: now,
//       status,
//     };

//     // Preserve previous attachment if no new file is uploaded
//     if (req.file) {
//       updateData.attachment =
//         `/uploads/${req.file.filename}`;
//     }

//     const submission = await AssignmentSubmission.findOneAndUpdate(
//       {
//         assignment: assignment._id,
//         student: student._id,
//       },
//       {
//         $set: updateData,
//         $setOnInsert: {
//           assignment: assignment._id,
//           student: student._id,
//         },
//       },
//       {
//         new: true,
//         upsert: true,
//         runValidators: true,
//       }
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Assignment submitted successfully",
//       data: submission,
//     });
//   } catch (error) {
//     console.error("Submit Assignment Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // ========================================
// // GET STUDENT SUBMISSIONS - TEACHER
// // ========================================
// exports.getAssignmentSubmissions = async (req, res) => {
//   try {
//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid assignment ID",
//       });
//     }

//     const assignment = await Assignment.findById(req.params.id);

//     if (!assignment) {
//       return res.status(404).json({
//         success: false,
//         message: "Assignment not found",
//       });
//     }

//     if (
//       assignment.teacher.toString() !==
//       req.user._id.toString()
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: "You cannot view another teacher's submissions",
//       });
//     }

//     const submissions = await AssignmentSubmission.find({
//       assignment: assignment._id,
//     })
//       .populate(
//         "student",
//         "studentId firstName middleName lastName currentClass section"
//       )
//       .sort({ submittedAt: -1 });

//     return res.status(200).json({
//       success: true,
//       assignment,
//       count: submissions.length,
//       data: submissions,
//     });
//   } catch (error) {
//     console.error("Get Assignment Submissions Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // ========================================
// // REVIEW STUDENT SUBMISSION - TEACHER
// // ========================================
// exports.reviewAssignmentSubmission = async (req, res) => {
//   try {
//     const { marksObtained, teacherRemarks } = req.body;

//     const submission = await AssignmentSubmission.findById(
//       req.params.submissionId
//     ).populate("assignment");

//     if (!submission) {
//       return res.status(404).json({
//         success: false,
//         message: "Submission not found",
//       });
//     }

//     const assignment = submission.assignment;

//     if (
//       !assignment ||
//       assignment.teacher.toString() !== req.user._id.toString()
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: "You cannot review another teacher's submission",
//       });
//     }

//     if (
//       marksObtained !== undefined &&
//       marksObtained !== ""
//     ) {
//       const marks = Number(marksObtained);

//       if (!Number.isFinite(marks) || marks < 0) {
//         return res.status(400).json({
//           success: false,
//           message: "Please enter valid marks",
//         });
//       }

//       if (
//         assignment.totalMarks !== null &&
//         assignment.totalMarks !== undefined &&
//         marks > assignment.totalMarks
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: `Marks cannot exceed ${assignment.totalMarks}`,
//         });
//       }

//       submission.marksObtained = marks;
//     }

//     submission.teacherRemarks = String(
//       teacherRemarks || ""
//     ).trim();

//     submission.status = "Reviewed";

//     await submission.save();

//     return res.status(200).json({
//       success: true,
//       message: "Submission reviewed successfully",
//       data: submission,
//     });
//   } catch (error) {
//     console.error("Review Assignment Submission Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

const mongoose = require("mongoose");

const Assignment = require("../models/Assignment");
const AssignmentSubmission = require("../models/AssignmentSubmission");
const Student = require("../models/Student");
const Subject = require("../models/Subject");

// ========================================
// CHECK TEACHER'S CLASS / SECTION / SUBJECT
// ========================================
const checkTeacherAssignment = async (
  teacherId,
  className,
  section,
  subjectName
) => {
  return Subject.findOne({
    className: String(className).trim(),
    section: String(section).trim(),
    subjects: {
      $elemMatch: {
        subjectName: String(subjectName).trim(),
        teacherUser: teacherId,
      },
    },
  });
};

// ========================================
// PARSE JSON FORM DATA
// ========================================
const parseJSON = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

// ========================================
// REMOVE CORRECT ANSWERS BEFORE SENDING
// TO STUDENTS
// ========================================
const hideCorrectAnswers = (assignment) => {
  const data = assignment.toObject
    ? assignment.toObject()
    : { ...assignment };

  data.questions = (data.questions || []).map((question) => {
    const item = { ...question };

    delete item.correctOptionIndex;
    delete item.correctBooleanAnswer;
    delete item.expectedAnswer;

    return item;
  });

  return data;
};

// ========================================
// CREATE ASSIGNMENT / QUIZ / CLASS TEST
// ========================================
exports.createAssignment = async (req, res) => {
  try {
    const {
      title,
      assignmentType,
      instructions,
      className,
      section,
      subjectName,
      academicYear,
      dueDate,
      totalMarks,
    } = req.body;

    if (
      !title ||
      !assignmentType ||
      !instructions ||
      !className ||
      !section ||
      !subjectName ||
      !dueDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required assignment details",
      });
    }

    const allowedTypes = [
      "Homework",
      "Quiz",
      "Class Test",
      "Project",
      "Assignment",
      "Other",
    ];

    if (!allowedTypes.includes(assignmentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment type",
      });
    }

    const parsedDueDate = new Date(dueDate);

    if (Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid due date",
      });
    }

    const assignedSubject = await checkTeacherAssignment(
      req.user._id,
      className,
      section,
      subjectName
    );

    if (!assignedSubject) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this class, section and subject",
      });
    }

    const questions = parseJSON(req.body.questions, []);
    const assessmentSettings = parseJSON(
      req.body.assessmentSettings,
      {}
    );

    const isOnlineTest = ["Quiz", "Class Test"].includes(
      assignmentType
    );

    let calculatedTotalMarks = null;

    if (isOnlineTest) {
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please add at least one question for the quiz or test",
        });
      }

      for (const question of questions) {
        if (
          !question.questionText ||
          !question.questionType ||
          !Number.isFinite(Number(question.marks)) ||
          Number(question.marks) <= 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Every question needs text, type and valid marks",
          });
        }

        if (question.questionType === "MCQ") {
          if (
            !Array.isArray(question.options) ||
            question.options.length < 2 ||
            !Number.isInteger(Number(question.correctOptionIndex)) ||
            Number(question.correctOptionIndex) < 0 ||
            Number(question.correctOptionIndex) >= question.options.length
          ) {
            return res.status(400).json({
              success: false,
              message: "MCQ questions need options and a valid correct option",
            });
          }
        }

        if (
          question.questionType === "True/False" &&
          typeof question.correctBooleanAnswer !== "boolean"
        ) {
          return res.status(400).json({
            success: false,
            message: "Please provide the correct True/False answer",
          });
        }

        if (
          !["MCQ", "True/False", "Short Answer", "Long Answer"].includes(
            question.questionType
          )
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid question type",
          });
        }
      }

      calculatedTotalMarks = questions.reduce(
        (sum, question) => sum + Number(question.marks),
        0
      );
    }

    const finalTotalMarks =
      totalMarks !== undefined && totalMarks !== ""
        ? Number(totalMarks)
        : calculatedTotalMarks;

    if (
      finalTotalMarks !== null &&
      (!Number.isFinite(finalTotalMarks) || finalTotalMarks < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter valid maximum marks",
      });
    }

    if (
      isOnlineTest &&
      Math.abs(finalTotalMarks - calculatedTotalMarks) > 0.001
    ) {
      return res.status(400).json({
        success: false,
        message: `Total marks must equal the sum of question marks (${calculatedTotalMarks})`,
      });
    }

    const startAt = assessmentSettings.startAt
      ? new Date(assessmentSettings.startAt)
      : null;

    const endAt = assessmentSettings.endAt
      ? new Date(assessmentSettings.endAt)
      : null;

    if (
      (startAt && Number.isNaN(startAt.getTime())) ||
      (endAt && Number.isNaN(endAt.getTime()))
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid test start and end times",
      });
    }

    if (startAt && endAt && endAt <= startAt) {
      return res.status(400).json({
        success: false,
        message: "Test end time must be after its start time",
      });
    }

    const assignment = await Assignment.create({
      title: String(title).trim(),
      assignmentType,
      instructions: String(instructions).trim(),
      className: String(className).trim(),
      section: String(section).trim(),
      subjectName: String(subjectName).trim(),
      teacher: req.user._id,
      academicYear: String(academicYear || "").trim(),
      dueDate: parsedDueDate,
      attachment: req.file
        ? `/uploads/${req.file.filename}`
        : "",
      isPublished: false,
      publishedAt: null,
      totalMarks: finalTotalMarks,
      questions: isOnlineTest ? questions : [],
      assessmentSettings: {
        startAt,
        endAt,
        durationMinutes: assessmentSettings.durationMinutes
          ? Number(assessmentSettings.durationMinutes)
          : null,
        maxAttempts: 1,
        allowLateSubmission:
          assessmentSettings.allowLateSubmission === true ||
          assessmentSettings.allowLateSubmission === "true",
        showResultsAfterEvaluation: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Create Assignment Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// GET TEACHER'S ASSIGNMENTS
// ========================================
exports.getTeacherAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      teacher: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    console.error("Get Teacher Assignments Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// PUBLISH ASSIGNMENT
// ========================================
exports.publishAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (assignment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot publish another teacher's assignment",
      });
    }

    const assignedSubject = await checkTeacherAssignment(
      req.user._id,
      assignment.className,
      assignment.section,
      assignment.subjectName
    );

    if (!assignedSubject) {
      return res.status(403).json({
        success: false,
        message: "You are no longer assigned to this subject",
      });
    }

    if (
      ["Quiz", "Class Test"].includes(assignment.assignmentType) &&
      (!assignment.questions || assignment.questions.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Add test questions before publishing",
      });
    }

    assignment.isPublished = true;
    assignment.publishedAt = new Date();

    await assignment.save();

    return res.status(200).json({
      success: true,
      message: "Assignment published successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Publish Assignment Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// GET ASSIGNMENTS FOR LOGGED-IN STUDENT
// ========================================
exports.getMyAssignments = async (req, res) => {
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

    const assignments = await Assignment.find({
      className: String(student.currentClass).trim(),
      section: String(student.section || "").trim(),
      isPublished: true,
    })
      .populate("teacher", "name email")
      .sort({ dueDate: 1 });

    const assignmentIds = assignments.map((item) => item._id);

    const submissions = await AssignmentSubmission.find({
      student: student._id,
      assignment: { $in: assignmentIds },
    });

    const submissionMap = new Map(
      submissions.map((item) => [
        item.assignment.toString(),
        item,
      ])
    );

    const result = assignments.map((assignment) => {
      const data = hideCorrectAnswers(assignment);

      data.mySubmission =
        submissionMap.get(assignment._id.toString()) || null;

      return data;
    });

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Get Student Assignments Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// SUBMIT HOMEWORK OR ONLINE QUIZ / TEST
// ========================================
exports.submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment || !assignment.isPublished) {
      return res.status(404).json({
        success: false,
        message: "Published assignment not found",
      });
    }

    const student = await Student.findOne({
      user: req.user._id,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student account is not linked to a student record",
      });
    }

    if (
      String(student.currentClass).trim() !== assignment.className ||
      String(student.section || "").trim() !== assignment.section
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot submit another class's assignment",
      });
    }

    const existingSubmission = await AssignmentSubmission.findOne({
      assignment: assignment._id,
      student: student._id,
    });

    const now = new Date();
    const settings = assignment.assessmentSettings || {};

    if (settings.startAt && now < new Date(settings.startAt)) {
      return res.status(400).json({
        success: false,
        message: "This test has not started yet",
      });
    }

    const deadline = settings.endAt || assignment.dueDate;

    if (
      now > new Date(deadline) &&
      settings.allowLateSubmission !== true
    ) {
      return res.status(400).json({
        success: false,
        message: "The submission deadline has passed",
      });
    }

    const isOnlineTest = ["Quiz", "Class Test"].includes(
      assignment.assignmentType
    );
    // Do not allow a student to submit an online test more than once.
if (isOnlineTest && existingSubmission) {
  return res.status(409).json({
    success: false,
    message: "You have already submitted this test.",
  });
}

    let updateData = {
      submittedAt: now,
      status: now > new Date(deadline) ? "Late" : "Submitted",
    };

    if (isOnlineTest) {
      const answers = parseJSON(req.body.answers, []);

      if (!Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please answer the test questions before submitting",
        });
      }

      const questionMap = new Map(
        assignment.questions.map((question) => [
          question._id.toString(),
          question,
        ])
      );

      const seenQuestionIds = new Set();
      let autoMarks = 0;
      let hasManualQuestions = false;

      const processedAnswers = [];

      for (const answer of answers) {
        const questionId = String(answer.questionId || "");

        if (
          !mongoose.Types.ObjectId.isValid(questionId) ||
          !questionMap.has(questionId) ||
          seenQuestionIds.has(questionId)
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid or duplicate question answer",
          });
        }

        seenQuestionIds.add(questionId);

        const question = questionMap.get(questionId);

        const savedAnswer = {
          questionId: question._id,
          answerText: "",
          selectedOptionIndex: null,
          booleanAnswer: null,
          marksObtained: null,
        };

        if (question.questionType === "MCQ") {
          const selected = Number(answer.selectedOptionIndex);

          if (
            !Number.isInteger(selected) ||
            selected < 0 ||
            selected >= question.options.length
          ) {
            return res.status(400).json({
              success: false,
              message: "Please select a valid option for each MCQ",
            });
          }

          savedAnswer.selectedOptionIndex = selected;

          if (selected === question.correctOptionIndex) {
            savedAnswer.marksObtained = question.marks;
            autoMarks += question.marks;
          } else {
            savedAnswer.marksObtained = 0;
          }
        } else if (question.questionType === "True/False") {
          if (typeof answer.booleanAnswer !== "boolean") {
            return res.status(400).json({
              success: false,
              message: "Please answer every True/False question",
            });
          }

          savedAnswer.booleanAnswer = answer.booleanAnswer;

          if (answer.booleanAnswer === question.correctBooleanAnswer) {
            savedAnswer.marksObtained = question.marks;
            autoMarks += question.marks;
          } else {
            savedAnswer.marksObtained = 0;
          }
        } else {
          const answerText = String(answer.answerText || "").trim();

          if (!answerText) {
            return res.status(400).json({
              success: false,
              message: "Please answer every written question",
            });
          }

          savedAnswer.answerText = answerText;
          hasManualQuestions = true;
        }

        processedAnswers.push(savedAnswer);
      }

      if (processedAnswers.length !== assignment.questions.length) {
        return res.status(400).json({
          success: false,
          message: "Please answer all test questions",
        });
      }

      updateData.answers = processedAnswers;
      updateData.autoMarks = autoMarks;
      updateData.evaluationStatus = hasManualQuestions
        ? "PartiallyEvaluated"
        : "AutoEvaluated";

      updateData.marksObtained = hasManualQuestions
        ? null
        : autoMarks;

      updateData.answer = "";
    } else {
      const answer = String(req.body.answer || "").trim();

      if (!answer && !req.file && !existingSubmission) {
        return res.status(400).json({
          success: false,
          message: "Please enter an answer or attach a file",
        });
      }

      updateData.answer = answer;
      updateData.evaluationStatus = "Pending";

      if (req.file) {
        updateData.attachment = `/uploads/${req.file.filename}`;
      }
    }

    const submission = await AssignmentSubmission.findOneAndUpdate(
      {
        assignment: assignment._id,
        student: student._id,
      },
      {
        $set: updateData,
        $setOnInsert: {
          assignment: assignment._id,
          student: student._id,
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
      message: isOnlineTest
        ? "Test submitted successfully"
        : "Assignment submitted successfully",
      data: submission,
    });
  } catch (error) {
    console.error("Submit Assignment Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// GET SUBMITTED AND NOT-SUBMITTED STUDENTS
// ========================================
exports.getAssignmentSubmissions = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (assignment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot view another teacher's submissions",
      });
    }

    const students = await Student.find({
      currentClass: assignment.className,
      section: assignment.section,
    }).select(
      "studentId firstName middleName lastName currentClass section"
    );

    const submissions = await AssignmentSubmission.find({
      assignment: assignment._id,
    })
      .populate(
        "student",
        "studentId firstName middleName lastName currentClass section"
      )
      .sort({ submittedAt: -1 });

    const submittedStudentIds = new Set(
      submissions.map((item) => item.student?._id?.toString())
    );

    const notSubmitted = students.filter(
      (student) => !submittedStudentIds.has(student._id.toString())
    );

    return res.status(200).json({
      success: true,
      assignment,
      totalStudents: students.length,
      submittedCount: submissions.length,
      notSubmittedCount: notSubmitted.length,
      evaluatedCount: submissions.filter(
        (item) => item.evaluationStatus === "Evaluated" ||
          item.status === "Reviewed"
      ).length,
      count: submissions.length,
      data: submissions,
      notSubmitted,
    });
  } catch (error) {
    console.error("Get Assignment Submissions Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// REVIEW HOMEWORK OR TEST ANSWERS
// ========================================
exports.reviewAssignmentSubmission = async (req, res) => {
  try {
    const { marksObtained, teacherRemarks, answers } = req.body;

    const submission = await AssignmentSubmission.findById(
      req.params.submissionId
    ).populate("assignment");

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    const assignment = submission.assignment;

    if (
      !assignment ||
      assignment.teacher.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot review another teacher's submission",
      });
    }

    // Optional question-by-question evaluation for written test answers
    if (Array.isArray(answers)) {
      for (const review of answers) {
        const studentAnswer = submission.answers.find(
          (item) =>
            item.questionId.toString() === String(review.questionId)
        );

        const question = assignment.questions.find(
          (item) =>
            item._id.toString() === String(review.questionId)
        );

        if (!studentAnswer || !question) {
          return res.status(400).json({
            success: false,
            message: "Invalid question in evaluation",
          });
        }

        const marks = Number(review.marksObtained);

        if (
          !Number.isFinite(marks) ||
          marks < 0 ||
          marks > question.marks
        ) {
          return res.status(400).json({
            success: false,
            message: `Marks for a question must be between 0 and ${question.marks}`,
          });
        }

        studentAnswer.marksObtained = marks;
        studentAnswer.teacherRemarks = String(
          review.teacherRemarks || ""
        ).trim();
      }

      const allEvaluated = submission.answers.every(
        (item) => item.marksObtained !== null
      );

      const manualMarks = submission.answers.reduce(
        (sum, item) => sum + (item.marksObtained || 0),
        0
      );

      submission.marksObtained = manualMarks;
      submission.evaluationStatus = allEvaluated
        ? "Evaluated"
        : "PartiallyEvaluated";
    } else if (
      marksObtained !== undefined &&
      marksObtained !== ""
    ) {
      const marks = Number(marksObtained);

      if (!Number.isFinite(marks) || marks < 0) {
        return res.status(400).json({
          success: false,
          message: "Please enter valid marks",
        });
      }

      if (
        assignment.totalMarks !== null &&
        assignment.totalMarks !== undefined &&
        marks > assignment.totalMarks
      ) {
        return res.status(400).json({
          success: false,
          message: `Marks cannot exceed ${assignment.totalMarks}`,
        });
      }

      submission.marksObtained = marks;
      submission.evaluationStatus = "Evaluated";
    }

    submission.teacherRemarks = String(
      teacherRemarks || ""
    ).trim();

    if (submission.marksObtained !== null) {
      submission.status = "Reviewed";
    }

    await submission.save();

    return res.status(200).json({
      success: true,
      message: "Submission reviewed successfully",
      data: submission,
    });
  } catch (error) {
    console.error("Review Assignment Submission Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
