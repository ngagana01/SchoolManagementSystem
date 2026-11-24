
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getAllEmployeeAttendance,
  getEmployeeAttendanceByDate,
  saveEmployeeAttendance,
  getMyEmployeeAttendance,
  getEmployeeAttendanceSummary,
} = require("../controllers/employeeAttendanceController");

// Teacher: View only their own attendance
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("teacher"),
  getMyEmployeeAttendance
);

router.get(
  "/employee/:employeeId/summary",
  authMiddleware,
  roleMiddleware("admin", "principal"),
  getEmployeeAttendanceSummary
);

// Admin and Principal: View all employee attendance
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "principal"),
  getAllEmployeeAttendance
);

// Admin and Principal: View attendance by date
router.get(
  "/by-date",
  authMiddleware,
  roleMiddleware("admin", "principal"),
  getEmployeeAttendanceByDate
);

// Admin only: Mark employee attendance
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  saveEmployeeAttendance
);

module.exports = router;
