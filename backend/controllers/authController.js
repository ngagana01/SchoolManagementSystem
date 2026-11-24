                                            
const User = require("../models/User");
const Student = require("../models/Student");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const LoginOTP = require("../models/LoginOTP");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const PasswordResetOTP = require("../models/PasswordResetOTP");

const {
  isValidEmail,
  validatePassword,
} = require("../utils/authValidation");

// ==========================================
// PUBLIC REGISTRATION DISABLED
// ==========================================

const register = async (req, res) => {
  return res.status(403).json({
    success: false,
    message:
      "Public registration is disabled. Please contact the school Admin.",
  });
};

// ==========================================
// LOGIN
// ==========================================

// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide email and password",
//       });
//     }

//     if (!isValidEmail(email)) {
//       return res.status(400).json({
//         success: false,
//         message: "Please enter a valid email address",
//       });
//     }

//     const normalizedEmail = email.trim().toLowerCase();

//     const user = await User.findOne({
//       email: normalizedEmail,
//     });

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid email or password",
//       });
//     }

//     const isMatch = await bcrypt.compare(
//       password,
//       user.password
//     );

//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid email or password",
//       });
//     }
//     // Prevent deactivated accounts from logging in.
// if (user.isActive === false) {
//   return res.status(403).json({
//     success: false,
//     message: "Your account is inactive. Please contact the school Admin.",
//   });
// }
    


//     // Verify Student account is linked to an admitted student.
//     if (user.role === "student") {
//       const student = await Student.findOne({
//         user: user._id,
//       });

//       if (!student) {
//         return res.status(403).json({
//           success: false,
//           message:
//             "You are not registered as a student. Please contact the school Admin.",
//         });
//       }
//     }

//     if (!process.env.JWT_SECRET) {
//       throw new Error("JWT_SECRET is missing in environment variables");
//     }

//     const token = jwt.sign(
//       {
//         id: user._id.toString(),
//         role: user.role,
//       },
//       process.env.JWT_SECRET,
//       {
//         expiresIn: "1d",
//       }
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Login successful",
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     });

//   } catch (error) {
//     console.error("Login error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong during login",
//     });
//   }
// };

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check account status.
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is inactive. Please contact the school Admin.",
      });
    }

    // Verify that the student account is linked.
    if (user.role === "student") {
      const student = await Student.findOne({
        user: user._id,
      });

      if (!student) {
        return res.status(403).json({
          success: false,
          message:
            "You are not registered as a student. Please contact the school Admin.",
        });
      }
    }

    // Check email configuration.
    if (
      !process.env.EMAIL_USER ||
      !process.env.EMAIL_APP_PASSWORD
    ) {
      throw new Error("Email configuration is missing");
    }

    // Generate a random 6-digit OTP.
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hash the OTP before storing it.
    const otpHash = await bcrypt.hash(otp, 10);

    // OTP expires after 5 minutes.
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Replace any previous OTP for this user.
    await LoginOTP.findOneAndUpdate(
      { user: user._id },
      {
        $set: {
          otpHash,
          expiresAt,
          attempts: 0,
          verified: false,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    try {
      await sendEmail(
        user.email,
        "Your School Management System Login OTP",
        `Your login verification code is ${otp}. It is valid for 5 minutes. Do not share this code with anyone.`
      );
    } catch (emailError) {
      await LoginOTP.deleteOne({ user: user._id });

      throw emailError;
    }

    return res.status(200).json({
      success: true,
      otpRequired: true,
      message: "OTP sent successfully to your registered email address.",
      userId: user._id,
    });

  } catch (error) {
    console.error("Login OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send verification email. Please try again later.",
    });
  }
};

// ==========================================
// ADMIN CREATES STUDENT LOGIN ACCOUNT
// ==========================================

const createStudentAccount = async (req, res) => {
  let createdUser = null;

  try {
    const { studentId } = req.params;
    const { email, password } = req.body;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid login email",
      });
    }

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (student.user) {
      return res.status(409).json({
        success: false,
        message: "This student already has a login account",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user = await User.findOne({
      email: normalizedEmail,
    });

    // Check whether an existing account can be linked.
    if (user) {
      if (user.role !== "student") {
        return res.status(409).json({
          success: false,
          message: "This email belongs to a non-student account",
        });
      }

      const alreadyLinked = await Student.findOne({
        user: user._id,
      });

      if (alreadyLinked) {
        return res.status(409).json({
          success: false,
          message: "This login account is already linked to another student",
        });
      }

      // Existing account keeps its current password.
    } else {
      // A new account needs a strong password.
      const passwordError = validatePassword(password);

      if (passwordError) {
        return res.status(400).json({
          success: false,
          message: passwordError,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const studentName = [
        student.firstName,
        student.middleName,
        student.lastName,
      ].filter(Boolean).join(" ");

      createdUser = await User.create({
        name: studentName,
        email: normalizedEmail,
        password: hashedPassword,
        role: "student",
      });

      user = createdUser;
    }

    // Link the login account to the admitted student.
    student.user = user._id;
    await student.save();

    const studentName = [
      student.firstName,
      student.middleName,
      student.lastName,
    ].filter(Boolean).join(" ");

    return res.status(201).json({
      success: true,
      message: "Student login account created successfully",
      data: {
        studentId: student._id,
        studentName,
        loginEmail: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    // Remove a newly created account if linking failed.
    if (createdUser) {
      await User.findByIdAndDelete(createdUser._id).catch(() => {});
    }

    console.error("Create student account error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create student login account",
    });
  }
};
// ADMIN CREATES EMPLOYEE LOGIN ACCOUNT
const createEmployeeAccount = async (req, res) => {
  let createdUser = null;

  try {
    const { employeeId } = req.params;
    const { password } = req.body;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (employee.user) {
      return res.status(409).json({
        success: false,
        message: "This employee already has a login account",
      });
    }

    if (!employee.email || !isValidEmail(employee.email)) {
      return res.status(400).json({
        success: false,
        message: "Please add a valid email to this employee record first",
      });
    }

    const roleMap = {
      teacher: "teacher",
      librarian: "librarian",
      principal: "principal",
      principle: "principal",
      "prrinciple": "principal",
      accountant: "accountant",
      accoutant: "accountant",
      
    };

    const employeeDesignation = String(employee.role || "")
  .trim()
  .toLowerCase();

const loginRole = roleMap[employeeDesignation];

if (!loginRole) {
  return res.status(400).json({
    success: false,
    message:
      "This employee designation is not eligible for a login account.",
  });
}

    const passwordError = validatePassword(password);

    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    const normalizedEmail = employee.email.trim().toLowerCase();

    const existingUser = await User.findOne({
  email: normalizedEmail,
});

if (existingUser) {
  return res.status(409).json({
    success: false,
    message:
      "An account with this email already exists. Please use another email.",
  });
}

// Make sure this employee is not already linked to another account
// const alreadyLinked = await Employee.findOne({
//   user: existingUser?._id,
// });

// if (alreadyLinked) {
//   return res.status(409).json({
//     success: false,
//     message: "This login account is already linked to another employee",
//   });
// }

    const hashedPassword = await bcrypt.hash(password, 12);

    createdUser = await User.create({
      name: employee.name,
      email: normalizedEmail,
      password: hashedPassword,
      role: loginRole,
    });

    employee.user = createdUser._id;
    await employee.save();

    return res.status(201).json({
      success: true,
      message: "Employee login account created successfully",
      data: {
        employeeId: employee._id,
        employeeName: employee.name,
        loginEmail: normalizedEmail,
        role: loginRole,
      },
    });
  } catch (error) {
    if (createdUser) {
      await User.findByIdAndDelete(createdUser._id).catch(() => {});
    }

    console.error("Create employee account error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create employee login account",
    });
  }
};

// ==========================================
// VERIFY LOGIN OTP
// ==========================================

const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: "User ID and OTP are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification request.",
      });
    }

    if (!/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit OTP.",
      });
    }

    const otpRecord = await LoginOTP.findOne({
      user: userId,
      verified: false,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please log in again to request a new OTP.",
      });
    }

    // Check OTP expiration.
    if (otpRecord.expiresAt <= new Date()) {
      await LoginOTP.deleteOne({ _id: otpRecord._id });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please log in again.",
      });
    }

    // Allow a maximum of 5 incorrect attempts.
    if (otpRecord.attempts >= 5) {
      await LoginOTP.deleteOne({ _id: otpRecord._id });

      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please log in again.",
      });
    }

    const isOTPValid = await bcrypt.compare(
      String(otp),
      otpRecord.otpHash
    );

    if (!isOTPValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      const remainingAttempts = 5 - otpRecord.attempts;

      return res.status(400).json({
        success: false,
        message:
          remainingAttempts > 0
            ? `Incorrect OTP. ${remainingAttempts} attempts remaining.`
            : "Too many incorrect attempts. Please log in again.",
        remainingAttempts,
      });
    }

    // Find the user again before issuing the token.
    const user = await User.findById(userId);

    if (!user || user.isActive === false) {
      await LoginOTP.deleteOne({ _id: otpRecord._id });

      return res.status(403).json({
        success: false,
        message: "Your account is unavailable or inactive.",
      });
    }

    // Recheck student account linking.
    if (user.role === "student") {
      const student = await Student.findOne({
        user: user._id,
      });

      if (!student) {
        await LoginOTP.deleteOne({ _id: otpRecord._id });

        return res.status(403).json({
          success: false,
          message: "Student account is not linked. Contact the Admin.",
        });
      }
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in environment variables");
    }

    // OTP is valid. Remove it so it cannot be reused.
    await LoginOTP.deleteOne({ _id: otpRecord._id });

    // Generate JWT only after successful OTP verification.
    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("OTP verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong during OTP verification.",
    });
  }
};
// RESEND LOGIN OTP
const resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const user = await User.findById(userId);

    if (!user || user.isActive === false) {
      return res.status(404).json({
        success: false,
        message: "User account not found or inactive.",
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await LoginOTP.findOneAndUpdate(
      { user: user._id },
      {
        $set: {
          otpHash,
          expiresAt,
          attempts: 0,
          verified: false,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    try {
      await sendEmail(
        user.email,
        "Your New School Management System Login OTP",
        `Your new login verification code is ${otp}. It is valid for 5 minutes. Do not share this code with anyone.`
      );
    } catch (emailError) {
      await LoginOTP.deleteOne({ user: user._id });

      throw emailError;
    }

    return res.status(200).json({
      success: true,
      message: "A new OTP has been sent to your registered email address.",
    });
  } catch (error) {
    console.error("Resend OTP error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to resend OTP. Please try again later.",
    });
  }
};

// FORGOT PASSWORD - SEND OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter your registered email address.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user account
    const user = await User.findOne({
      email: normalizedEmail,
      isActive: { $ne: false },
    });

    // Do not reveal whether an email is registered
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password-reset OTP has been sent.",
      });
    }

    // Generate a secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hash OTP before storing it
    const otpHash = await bcrypt.hash(otp, 10);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await PasswordResetOTP.findOneAndUpdate(
      { user: user._id },
      {
        $set: {
          otpHash,
          expiresAt,
          attempts: 0,
          verified: false,
          resetToken: null,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    try {
      await sendEmail(
        user.email,
        "Password Reset OTP - School Management System",
        `Your password-reset verification code is ${otp}. It is valid for 5 minutes. Do not share this code with anyone.`
      );
    } catch (emailError) {
      await PasswordResetOTP.deleteOne({
        user: user._id,
      });

      throw emailError;
    }

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password-reset OTP has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process your request. Please try again later.",
    });
  }
};

// VERIFY FORGOT PASSWORD OTP
const verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    if (!/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit OTP.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
      isActive: { $ne: false },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    const otpRecord = await PasswordResetOTP.findOne({
      user: user._id,
    });

    if (!otpRecord || otpRecord.verified) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new one.",
      });
    }

    if (otpRecord.expiresAt <= new Date()) {
      await PasswordResetOTP.deleteOne({ _id: otpRecord._id });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (otpRecord.attempts >= 5) {
      await PasswordResetOTP.deleteOne({ _id: otpRecord._id });

      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    const isValidOTP = await bcrypt.compare(
      String(otp),
      otpRecord.otpHash
    );

    if (!isValidOTP) {
      otpRecord.attempts += 1;

      if (otpRecord.attempts >= 5) {
        await PasswordResetOTP.deleteOne({ _id: otpRecord._id });

        return res.status(429).json({
          success: false,
          message: "Too many incorrect attempts. Please request a new OTP.",
        });
      }

      await otpRecord.save();

      return res.status(400).json({
        success: false,
        message: `Incorrect OTP. ${5 - otpRecord.attempts} attempts remaining.`,
      });
    }

    // Generate a secure password-reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    otpRecord.verified = true;
    otpRecord.resetToken = resetToken;

    await otpRecord.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can now reset your password.",
      resetToken,
    });
  } catch (error) {
    console.error("Password reset OTP verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP. Please try again later.",
    });
  }
};

 // RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword, confirmPassword } = req.body;

    if (!email || !resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    // Validate password strength
    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[^A-Za-z0-9]/.test(newPassword)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
      isActive: { $ne: false },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password-reset session.",
      });
    }

    const otpRecord = await PasswordResetOTP.findOne({
      user: user._id,
      verified: true,
    });

    if (!otpRecord || !otpRecord.resetToken) {
      return res.status(400).json({
        success: false,
        message: "Please verify your OTP again.",
      });
    }

    if (otpRecord.expiresAt <= new Date()) {
      await PasswordResetOTP.deleteOne({ _id: otpRecord._id });

      return res.status(400).json({
        success: false,
        message: "Password-reset session expired. Please start again.",
      });
    }

    // Compare reset tokens safely
    const storedToken = Buffer.from(otpRecord.resetToken);
    const submittedToken = Buffer.from(String(resetToken));

    if (
      storedToken.length !== submittedToken.length ||
      !crypto.timingSafeEqual(storedToken, submittedToken)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid password-reset token.",
      });
    }

    // Hash and update the new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Delete used password-reset OTP
    await PasswordResetOTP.deleteOne({
      _id: otpRecord._id,
    });

    // Invalidate any pending login OTP
    await LoginOTP.deleteOne({
      user: user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in with your new password.",
    });

  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password. Please try again later.",
    });
  }
};



module.exports = {
  register,
  login,
  verifyOTP,
  resendOTP,
  forgotPassword,
  verifyForgotPasswordOTP,
  resetPassword,
  createStudentAccount,
  createEmployeeAccount,
  
};

