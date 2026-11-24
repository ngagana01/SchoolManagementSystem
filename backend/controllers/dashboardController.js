const Student = require("../models/Student");
const Employee = require("../models/Employee");
const FeePayment = require("../models/FeePayment");
const StudentAttendance = require("../models/StudentAttendance");

exports.getDashboardStats = async (req, res) => {
  try {
    // Get total students and employees
    const [totalStudents, totalEmployees] = await Promise.all([
      Student.countDocuments(),
      Employee.countDocuments(),
    ]);

    // Calculate total fee collection
    const feeResult = await FeePayment.aggregate([
      {
        $group: {
          _id: null,
          totalIncome: { $sum: "$amount" },
        },
      },
    ]);

    const totalIncome = feeResult[0]?.totalIncome || 0;

    // Get today's date in YYYY-MM-DD format
    const now = new Date();

    const today =
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // Get today's student attendance
    const attendanceResult = await StudentAttendance.aggregate([
      {
        $match: {
          date: today,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const attendance = {
      present: 0,
      absent: 0,
      leave: 0,
    };

    attendanceResult.forEach((item) => {
      if (item._id === "Present") {
        attendance.present = item.count;
      } else if (item._id === "Absent") {
        attendance.absent = item.count;
      } else if (item._id === "Leave") {
        attendance.leave = item.count;
      }
    });

    const attendanceTotal =
      attendance.present + attendance.absent + attendance.leave;

    const attendancePercentage =
      attendanceTotal > 0
        ? Math.round((attendance.present / attendanceTotal) * 100)
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalEmployees,
        totalIncome,
        attendance,
        attendancePercentage,
        attendanceDate: today,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard statistics.",
      error: error.message,
    });
  }
};