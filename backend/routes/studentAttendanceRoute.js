
// const express = require("express");
// const router = express.Router();

// const authMiddleware = require("../middleware/authMiddleware");
// const roleMiddleware = require("../middleware/roleMiddleware");

// const {
//   saveStudentAttendance,
//   getStudentAttendanceByDate,

// } = require("../controllers/studentAttendanceController");

// // Admin and Teacher can mark student attendance
// router.post(
//   "/",
//   authMiddleware,
//   roleMiddleware("admin", "teacher"),
//   saveStudentAttendance
// );

// // Admin and Teacher can view student attendance by date
// router.get(
//   "/by-date",
//   authMiddleware,
//   roleMiddleware("admin", "teacher"),
//   getStudentAttendanceByDate
// );

// module.exports = router;

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  saveStudentAttendance,
  getStudentAttendanceByDate,
  getMyStudentAttendance,
} = require("../controllers/studentAttendanceController");

// Student: view only their own attendance
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("student"),
  getMyStudentAttendance
);

// Admin and Teacher: mark attendance
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "teacher"),
  saveStudentAttendance
);

// Admin and Teacher: view attendance by date
router.get(
  "/by-date",
  authMiddleware,
  roleMiddleware("admin", "teacher","principal"),
  getStudentAttendanceByDate
);

module.exports = router;
