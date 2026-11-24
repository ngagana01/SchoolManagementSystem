
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const upload = require("../middleware/upload");

const {
  createAssignment,
  getTeacherAssignments,
  publishAssignment,
  getMyAssignments,
  submitAssignment,
  getAssignmentSubmissions,
  reviewAssignmentSubmission,
} = require("../controllers/assignmentController");

// ========================================
// TEACHER ROUTES
// ========================================

// Create assignment with optional attachment
router.post(
  "/",
  authMiddleware,
  roleMiddleware("teacher"),
  upload.single("attachment"),
  createAssignment
);

// Get logged-in teacher's assignments
router.get(
  "/teacher",
  authMiddleware,
  roleMiddleware("teacher"),
  getTeacherAssignments
);

// Publish assignment
router.put(
  "/publish/:id",
  authMiddleware,
  roleMiddleware("teacher"),
  publishAssignment
);

// View submissions for an assignment
router.get(
  "/:id/submissions",
  authMiddleware,
  roleMiddleware("teacher"),
  getAssignmentSubmissions
);

// ========================================
// STUDENT ROUTES
// ========================================

// Get assignments for logged-in student
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("student"),
  getMyAssignments
);

// Submit assignment with optional attachment
router.post(
  "/:id/submit",
  authMiddleware,
  roleMiddleware("student"),
  upload.single("attachment"),
  submitAssignment
);
router.put(
  "/submissions/:submissionId/review",
  authMiddleware,
  roleMiddleware("teacher"),
  reviewAssignmentSubmission
);

module.exports = router;
