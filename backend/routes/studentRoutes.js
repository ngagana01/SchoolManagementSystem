
// const express = require("express");
// const router = express.Router();

// const authMiddleware = require("../middleware/authMiddleware");
// const roleMiddleware = require("../middleware/roleMiddleware");

// const {
//   addStudent,
//   getStudents,
//   getStudentById,
//   updateStudent,
//   deleteStudent,
// } = require("../controllers/studentController");

// // Add Student - Admin and Teacher
// router.post(
//   "/students",
//   authMiddleware,
//   roleMiddleware("admin", "teacher"),
//   addStudent
// );

// // Get All Students - Admin and Teacher
// router.get(
//   "/students",
//   authMiddleware,
//   roleMiddleware("admin", "teacher"),
//   getStudents
// );

// // Get Single Student - Admin and Teacher
// router.get(
//   "/students/:id",
//   authMiddleware,
//   roleMiddleware("admin", "teacher"),
//   getStudentById
// );

// // Update Student - Admin and Teacher
// router.put(
//   "/students/:id",
//   authMiddleware,
//   roleMiddleware("admin", "teacher"),
//   updateStudent
// );

// // Delete Student - Admin only
// router.delete(
//   "/students/:id",
//   authMiddleware,
//   roleMiddleware("admin"),
//   deleteStudent
// );

// module.exports = router;

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  addStudent,
  getStudents,
  getStudentById,
  getMyStudentProfile,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");

// Add student - Admin and Teacher
router.post(
  "/students",
  authMiddleware,
  roleMiddleware("admin", "teacher"),
  addStudent
);

// View all students - Admin, Principal, Teacher and Accountant
router.get(
  "/students",
  authMiddleware,
  roleMiddleware("admin", "principal", "teacher", "accountant"),
  getStudents
);
// Get logged-in student's own profile
router.get(
  "/students/me",
  authMiddleware,
  roleMiddleware("student"),
  getMyStudentProfile
);

// View one student - Admin, Principal, Teacher and Accountant
router.get(
  "/students/:id",
  authMiddleware,
  roleMiddleware("admin", "principal", "teacher", "accountant"),
  getStudentById
);


// Update student - Admin and Teacher
router.put(
  "/students/:id",
  authMiddleware,
  roleMiddleware("admin", "teacher"),
  updateStudent
);

// Delete student - Admin only
router.delete(
  "/students/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteStudent
);

module.exports = router;
