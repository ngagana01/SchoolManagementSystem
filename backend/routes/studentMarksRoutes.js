
const express = require("express");
const router = express.Router();

const {
  getStudentsForMarks,
  saveStudentMarks,
  getTeacherMarks,
  publishStudentMarks,
  getMyMarks,
} = require("../controllers/studentMarksController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// ==========================================
// TEACHER ROUTES
// ==========================================

// Get students for marks entry
router.get(
  "/students",
  authMiddleware,
  roleMiddleware("teacher"),
  getStudentsForMarks
);

// Enter or update student marks
router.post(
  "/",
  authMiddleware,
  roleMiddleware("teacher"),
  saveStudentMarks
);

// Get marks entered by logged-in teacher
router.get(
  "/teacher",
  authMiddleware,
  roleMiddleware("teacher"),
  getTeacherMarks
);

// Publish marks
router.put(
  "/publish/:id",
  authMiddleware,
  roleMiddleware("teacher"),
  publishStudentMarks
);

// ==========================================
// STUDENT ROUTE
// ==========================================

// Get logged-in student's published marks
router.get(
  "/my-marks",
  authMiddleware,
  roleMiddleware("student"),
  getMyMarks
);

module.exports = router;
