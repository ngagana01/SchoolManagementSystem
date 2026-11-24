// const express = require("express");

// const router = express.Router();

// const {
//   addFeePayment,
//   getStudentFeePayments,
//   getStudentFeeSummary,
// } = require("../controllers/feePaymentController");

// // Record a payment
// router.post("/", addFeePayment);

// // Get payment history for a student
// router.get("/:studentId", getStudentFeePayments);

// // Get fee summary and outstanding balances
// router.get("/:studentId/summary", getStudentFeeSummary);

// module.exports = router;


const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  addFeePayment,
  getStudentFeePayments,
  getStudentFeeSummary,
  getMyStudentFeePayments,
  getMyStudentFeeSummary,
} = require("../controllers/feePaymentController");

// Student: own fee summary
router.get(
  "/my/summary",
  authMiddleware,
  roleMiddleware("student"),
  getMyStudentFeeSummary
);

// Student: own payment history
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("student"),
  getMyStudentFeePayments
);

// Admin and Accountant: record payments
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "accountant"),
  addFeePayment
);

// Admin and Accountant: view payment history
router.get(
  "/:studentId",
  authMiddleware,
  roleMiddleware("admin", "accountant"),
  getStudentFeePayments
);

// Admin and Accountant: view fee summary
router.get(
  "/:studentId/summary",
  authMiddleware,
  roleMiddleware("admin", "accountant"),
  getStudentFeeSummary
);

module.exports = router;
