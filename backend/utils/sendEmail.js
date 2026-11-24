
const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"School Management System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>School Management System</h2>
          <p>${message}</p>
          <p style="color: #777;">
            If you did not request this code, please ignore this email.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully to:", to);
    return true;
  } catch (error) {
    console.error("Email sending error:", error.message);
    throw new Error("Unable to send verification email.");
  }
};

module.exports = sendEmail;
