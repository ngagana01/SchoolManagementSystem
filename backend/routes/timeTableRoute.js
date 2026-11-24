
// // const express = require("express");
// // const router = express.Router();

// // const {
// //   getSubjectsForClass,
// //   getTimeTable,
// //   saveTimeTable,
// //   getMyTimeTable,
// // } = require("../controllers/timeTableController");

// // router.get("/subjects", getSubjectsForClass);
// // router.get(
// //   "/my",
// //   authMiddleware,
// //   roleMiddleware("student"),
// //   getMyTimeTable
// // );
// // router.get("/", getTimeTable);
// // router.post("/", saveTimeTable);

// // module.exports = router;

// const express = require("express");
// const router = express.Router();

// const {
//   getSubjectsForClass,
//   getTimeTable,
//   saveTimeTable,
//   getMyTimeTable,
// } = require("../controllers/timeTableController");

// const authMiddleware = require("../middleware/authMiddleware");
// const roleMiddleware = require("../middleware/roleMiddleware");

// // Student: View only their own timetable
// router.get(
//   "/my",
//   authMiddleware,
//   roleMiddleware("student"),
//   getMyTimeTable
// );

// // Admin and Teacher: Get subjects for a class
// router.get(
//   "/subjects",
//   authMiddleware,
//   roleMiddleware("admin", "teacher"),
//   getSubjectsForClass
// );

// // Admin, Principal and Teacher: View a selected class timetable
// router.get(
//   "/",
//   authMiddleware,
//   roleMiddleware("admin", "principal", "teacher"),
//   getTimeTable
// );

// // Admin and Teacher: Create or update timetable
// router.post(
//   "/",
//   authMiddleware,
//   roleMiddleware("admin", "teacher"),
//   saveTimeTable
// );

// module.exports = router;

const express = require("express");
const router = express.Router();

const {
  getSubjectsForClass,
  getTimeTable,
  saveTimeTable,
  getMyTimeTable,
  getMyTeacherClasses,
  getMyTeacherTimeTable,
} = require("../controllers/timeTableController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// ========================================
// STUDENT: OWN CLASS TIMETABLE
// ========================================
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("student"),
  getMyTimeTable
);

// ========================================
// TEACHER: ONLY ASSIGNED CLASSES
// ========================================
router.get(
  "/my-teacher-classes",
  authMiddleware,
  roleMiddleware("teacher"),
  getMyTeacherClasses
);

router.get(
  "/my-teacher",
  authMiddleware,
  roleMiddleware("teacher"),
  getMyTeacherTimeTable
);

// ========================================
// ADMIN / TEACHER: SUBJECTS FOR SELECTED CLASS
// ========================================
router.get(
  "/subjects",
  authMiddleware,
  roleMiddleware("admin", "teacher"),
  getSubjectsForClass
);

// ========================================
// ADMIN / PRINCIPAL: ANY CLASS TIMETABLE
// ========================================
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "principal"),
  getTimeTable
);

// ========================================
// ADMIN / TEACHER: CREATE OR UPDATE TIMETABLE
// Keep your existing creation permission for now.
// ========================================
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "teacher"),
  saveTimeTable
);

module.exports = router;
