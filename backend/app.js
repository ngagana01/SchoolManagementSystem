const express = require("express")

const cors = require("cors");
const path = require("path");

//app.use(express.json());

const classRoutes = require("./routes/classRoutes");
const studentRoutes=require("./routes/studentRoutes");


const authRoutes=require("./routes/authRoutes");
const subjectRoutes=require("./routes/subjectRoutes")
const employeeRoute=require("./routes/employeeRoute");
const employeeAttendanceRoute=require("./routes/employeeAttendanceRoute");
const feesStructureRoute=require("./routes/feesStructureRoute");
const feePaymentRoute = require("./routes/feePaymentRoute");
const studentFeeAssignmentRoute = require("./routes/studentFeeAssignmentRoute");
const timeSlotRoute = require("./routes/timeSlotRoute");
const timeTableRoute = require("./routes/timeTableRoute");
const assignmentRoutes = require("./routes/assignmentRoutes");
const salaryRoutes = require("./routes/salaryRoutes");

const feeReportRoute = require("./routes/feeReportRoute");
const bookRoutes = require("./routes/bookRoutes");
const studentAttendanceRoute = require("./routes/studentAttendanceRoute");
const dashboardRoute = require("./routes/dashboardRoute");
const studentMarksRoutes = require("./routes/studentMarksRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const examRoutes = require("./routes/examRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/employees", require("./routes/employeeRoute"));
app.use("/api/time-tables", timeTableRoute);


// Test Route
app.get("/", (req, res) => {
  res.send("Backend Running");
});

// Routes
app.use("/api/dashboard", dashboardRoute);
app.use("/api", classRoutes);
app.use("/api",studentRoutes)
app.use("/api/auth",authRoutes);
app.use("/api",subjectRoutes)
app.use("/api/employees",employeeRoute);
app.use("/api/employee-attendance",employeeAttendanceRoute)
app.use("/api/fees-structures",feesStructureRoute);
app.use("/api/fee-payments", feePaymentRoute);
app.use("/api/student-fee-assignments", studentFeeAssignmentRoute);
app.use("/api/fee-reports", feeReportRoute);
app.use("/api/time-tables", timeTableRoute);
app.use("/api/time-slots", timeSlotRoute);
app.use("/api/books", bookRoutes);
app.use("/api/student-attendance", studentAttendanceRoute);
app.use("/api/student-marks", studentMarksRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/salaries", salaryRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/exams", examRoutes);


module.exports = app;