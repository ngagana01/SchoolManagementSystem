
const express = require("express");
const router = express.Router();

const {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam,
} = require("../controllers/examController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// All exam routes require login
router.use(authMiddleware);

// Admin, Principal and Teacher can view exams
router.get(
  "/",
  roleMiddleware("admin", "principal", "teacher"),
  getAllExams
);

router.get(
  "/:id",
  roleMiddleware("admin", "principal", "teacher"),
  getExamById
);

// Only Admin can create, update and delete exams
router.post(
  "/",
  roleMiddleware("admin"),
  createExam
);

router.put(
  "/:id",
  roleMiddleware("admin"),
  updateExam
);

router.delete(
  "/:id",
  roleMiddleware("admin"),
  deleteExam
);

module.exports = router;
