// const express = require("express");

// const router = express.Router();

// const {
//   addClass,
//   getClasses,
//   deleteClass,
//   updateClass
// } = require("../controllers/classController");

// router.post(
//   "/add-class",
//   addClass
// );

// router.get(
//   "/classes",
//   getClasses
// );

// router.put(
//   "/class/:id",
//   updateClass
// );

// router.delete(
//   "/class/:id",
//   deleteClass
// );
// module.exports = router;

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  addClass,
  getClasses,
  deleteClass,
  updateClass,
} = require("../controllers/classController");

// Add class - Admin and Teacher
router.post(
  "/add-class",
  authMiddleware,
  roleMiddleware("admin", "teacher"),
  addClass
);

// View classes - Admin, Principal and Teacher
router.get(
  "/classes",
  authMiddleware,
  roleMiddleware("admin", "principal", "teacher"),
  getClasses
);

// Update class - Admin and Teacher
router.put(
  "/class/:id",
  authMiddleware,
  roleMiddleware("admin", "teacher"),
  updateClass
);

// Delete class - Admin only
router.delete(
  "/class/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteClass
);

module.exports = router;
