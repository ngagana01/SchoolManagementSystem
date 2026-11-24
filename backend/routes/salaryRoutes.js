
const express = require("express");
const router = express.Router();

const {
  addSalaryPayment,
  getAllSalaryPayments,
  getMySalary,
} = require("../controllers/salaryController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Teacher: view only their own salary
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("teacher"),
  getMySalary
);

// Admin and Principal: view all salary payments
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "principal"),
  getAllSalaryPayments
);

// Admin: record salary payments
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  addSalaryPayment
);

module.exports = router;
