

const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  addEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  deactivateEmployee,
  reactivateEmployee,
  getMyEmployment,
} = require("../controllers/employeeController");

// Add employee - Admin only
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  upload.single("employeePhoto"),
  addEmployee
);

// View all employees - Admin, Principal and Teacher
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "principal"),
  getAllEmployees
);

// Teacher - View own employment details
router.get(
  "/my-employment",
  authMiddleware,
  roleMiddleware("teacher"),
  getMyEmployment
);
// Deactivate employee - Admin only
router.patch(
  "/:id/deactivate",
  authMiddleware,
  roleMiddleware("admin"),
  deactivateEmployee
);

// Reactivate employee - Admin only
router.patch(
  "/:id/reactivate",
  authMiddleware,
  roleMiddleware("admin"),
  reactivateEmployee
);

// View one employee - Admin, Principal and Teacher
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "principal"),
  getEmployeeById
);

// Update employee - Admin only
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  upload.single("employeePhoto"),
  updateEmployee
);

// Delete employee - Admin only
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteEmployee
);

module.exports = router;
