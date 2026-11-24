// const express = require("express");
// const router = express.Router();

// const {
//   createStudentFeeAssignment,
//   getStudentFeeAssignments,
//   getMyStudentFeeAssignments,
// } = require("../controllers/studentFeeAssignmentController");

// // Create a fee assignment
// router.post("/", createStudentFeeAssignment);

// // Get fee assignments for one student
// router.get("/:studentId", getStudentFeeAssignments);

// module.exports = router;


const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  createStudentFeeAssignment,
  getStudentFeeAssignments,
  getMyStudentFeeAssignments,
} = require("../controllers/studentFeeAssignmentController");

// Student: own assignments only
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("student"),
  getMyStudentFeeAssignments
);

// Admin and Accountant: create assignments
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "accountant"),
  createStudentFeeAssignment
);

// Admin and Accountant: view a student's assignments
router.get(
  "/:studentId",
  authMiddleware,
  roleMiddleware("admin", "accountant"),
  getStudentFeeAssignments
);

module.exports = router;
