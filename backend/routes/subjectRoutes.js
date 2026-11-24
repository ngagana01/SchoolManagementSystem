


// const express = require("express");
// const router = express.Router();

// const {
//   addSubject,
//   getSubjects,
//   deleteSubject,
//   getSingleSubject,
//   updateSubject,
// } = require("../controllers/subjectController");

// // Get all subjects
// router.get("/subjects", getSubjects);

// // Add a subject
// router.post("/subjects", addSubject);

// // Test route
// router.get("/test-subject", (req, res) => {
//   res.send("Subject Route Working");
// });

// // Get, update, and delete one subject by ID
// router.get("/subjects/:id", getSingleSubject);
// router.put("/subjects/:id", updateSubject);
// router.delete("/subjects/:id", deleteSubject);

// module.exports = router;

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  addSubject,
  getSubjects,
  deleteSubject,
  getSingleSubject,
  updateSubject,
  getAvailableTeachers,
} = require("../controllers/subjectController");

// Available teachers - Admin only
router.get(
  "/teachers",
  authMiddleware,
  roleMiddleware("admin"),
  getAvailableTeachers
);

// Get subjects
router.get(
  "/subjects",
  authMiddleware,
  roleMiddleware("admin", "principal", "teacher"),
  getSubjects
);

// Add subjects - Admin only
router.post(
  "/subjects",
  authMiddleware,
  roleMiddleware("admin"),
  addSubject
);

// Test route
router.get("/test-subject", (req, res) => {
  res.send("Subject Route Working");
});

// Get one subject
router.get(
  "/subjects/:id",
  authMiddleware,
  roleMiddleware("admin", "principal", "teacher"),
  getSingleSubject
);

// Update subject - Admin only
router.put(
  "/subjects/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateSubject
);

// Delete subject - Admin only
router.delete(
  "/subjects/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteSubject
);

module.exports = router;
