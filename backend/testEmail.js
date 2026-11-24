
require("dotenv").config();
console.log("EMAIL_USER loaded:", !!process.env.EMAIL_USER);
console.log(
  "EMAIL_APP_PASSWORD loaded:",
  !!process.env.EMAIL_APP_PASSWORD
);

const sendEmail = require("./utils/sendEmail");

const testEmail = async () => {
  try {
    await sendEmail(
      process.env.EMAIL_USER,
      "School Management System - Email Test",
      "Your Gmail configuration is working successfully!"
    );

    console.log("TEST SUCCESSFUL: Email sent!");
  } catch (error) {
    console.error("TEST FAILED:", error.message);
  }
};

testEmail();
