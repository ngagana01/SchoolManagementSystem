
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (email, otp, name) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email SMTP settings are missing in .env");
  }

  await transporter.sendMail({
    from: `"School Management System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your login verification code",
    text: `Hello ${name}, your login verification code is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e5e5;border-radius:10px">
        <h2 style="color:#5736b6">Login verification</h2>
        <p>Hello ${name},</p>
        <p>Use this 6-digit code to complete your login:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#5736b6;padding:16px 0">
          ${otp}
        </div>
        <p>This code expires in <b>5 minutes</b>.</p>
        <p>If you did not try to log in, please ignore this email and secure your account.</p>
        <small>School Management System</small>
      </div>
    `,
  });
};

module.exports = sendOTPEmail;
