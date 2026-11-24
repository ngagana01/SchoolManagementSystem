const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const rateLimit = require("express-rate-limit");

// Authentication controller
const {
  register,
  login,
  verifyOTP,
  resendOTP,
  forgotPassword,
  verifyForgotPasswordOTP,
  resetPassword,
  createStudentAccount,
  createEmployeeAccount,
} = require("../controllers/authController");

// Profile controller
const {
  getProfile,
  updateProfile,
} = require("../controllers/profileController");

// Limit repeated login requests
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

// Limit incorrect OTP verification requests
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP verification requests. Please try again later.",
  },
});
const resendOTPLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP resend requests. Please try again later.",
  },
});
// Limit forgot-password requests
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password-reset requests. Please try again after 15 minutes.",
  },
});
// Limit password-reset OTP verification
const verifyForgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP verification attempts. Please try again later.",
  },
});

// Limit password-reset submissions
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password-reset requests. Please try again later.",
  },
});

// Middlewares
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Public authentication routes
router.post("/register", register);
router.post("/login", loginLimiter, login);
router.post("/verify-otp", otpLimiter, verifyOTP);
router.post("/resend-otp", resendOTPLimiter, resendOTP);
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  forgotPassword
);
router.post(
  "/verify-forgot-password-otp",
  verifyForgotPasswordLimiter,
  verifyForgotPasswordOTP
);

router.post(
  "/reset-password",
  resetPasswordLimiter,
  resetPassword
);

// User profile routes
router.get("/profile", authMiddleware, getProfile);
//router.put("/profile", authMiddleware, updateProfile);
router.put(
  "/profile",
  authMiddleware,
  upload.single("profilePicture"),
  updateProfile
);

// Create student login account - Admin only
router.post(
  "/students/:studentId/account",
  authMiddleware,
  roleMiddleware("admin"),
  createStudentAccount
);
// ADMIN CREATES EMPLOYEE LOGIN ACCOUNT
router.post(
  "/employees/:employeeId/account",
  authMiddleware,
  roleMiddleware("admin"),
  createEmployeeAccount
);

module.exports = router;
