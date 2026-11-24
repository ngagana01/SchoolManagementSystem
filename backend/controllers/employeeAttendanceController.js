const mongoose = require("mongoose");

const Employee = require("../models/Employee");
const EmployeeAttendance = require("../models/EmployeeAttendance");

// GET: Retrieve all employee attendance records
exports.getAllEmployeeAttendance = async (req, res) => {
  try {
    const attendance = await EmployeeAttendance.find()
      .populate("employee", "name employeeId role")
      .sort({ date: -1 });

    return res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    console.error("Get Employee Attendance Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve employee attendance.",
    });
  }
};

// GET: Retrieve attendance for a particular date
exports.getEmployeeAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (
  !date ||
  !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
  Number.isNaN(new Date(`${date}T00:00:00.000Z`).getTime()) ||
  new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) !== date
) {
  return res.status(400).json({
    success: false,
    message: "Please provide a valid date in YYYY-MM-DD format.",
  });
}

    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1);

    const attendance = await EmployeeAttendance.find({
      date: { $gte: start, $lt: end },
    })
      .populate("employee", "name employeeId role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    console.error("Get Attendance By Date Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve attendance for this date.",
    });
  }
};

// POST: Create or update attendance for one employee
exports.saveEmployeeAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, remarks = "" } = req.body;
    if (typeof remarks !== "string") {
  return res.status(400).json({
    success: false,
    message: "Remarks must be a valid text value.",
  });
}

    if (!employeeId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: "Employee, date, and attendance status are required.",
      });
    }

    if (!mongoose.isValidObjectId(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID.",
      });
    }

    if (!["Present", "Absent", "Leave"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance status.",
      });
    }

    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return res.status(400).json({
        success: false,
        message: "Date must use YYYY-MM-DD format.",
      });
    }

    const attendanceDate = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(attendanceDate.getTime()) ||
      attendanceDate.toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance date.",
      });
    }

    const employeeExists = await Employee.findById(employeeId);

    if (!employeeExists) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    const attendance = await EmployeeAttendance.findOneAndUpdate(
      {
        employee: employeeId,
        date: attendanceDate,
      },
      {
        $set: {
          status,
          remarks,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).populate("employee", "name employeeId role");

    return res.status(200).json({
      success: true,
      message: "Employee attendance saved successfully.",
      data: attendance,
    });
  } catch (error) {
    console.error("Save Employee Attendance Error:", error);

    // A concurrent request may have created the unique record first.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Attendance already exists for this employee and date. Please retry.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to save employee attendance.",
    });
  }
};

// GET: Retrieve attendance of the logged-in teacher
exports.getMyEmployeeAttendance = async (req, res) => {
  try {
    // Find the employee record linked to this login account
    const employee = await Employee.findOne({
      user: req.user._id,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Your employee profile is not linked to this account.",
      });
    }

    const attendance = await EmployeeAttendance.find({
      employee: employee._id,
    }).sort({ date: -1 });

    const summary = {
      present: attendance.filter(
        (item) => item.status === "Present"
      ).length,

      absent: attendance.filter(
        (item) => item.status === "Absent"
      ).length,

      leave: attendance.filter(
        (item) => item.status === "Leave"
      ).length,

      totalDays: attendance.length,
    };

    return res.status(200).json({
      success: true,
      employee: {
        name: employee.name,
        employeeId: employee.employeeId,
        role: employee.role,
      },
      summary,
      data: attendance,
    });
  } catch (error) {
    console.error("Get My Employee Attendance Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your attendance.",
    });
  }
};

// ==========================================
// GET: Employee Attendance Summary
// Admin and Principal
// ==========================================
exports.getEmployeeAttendanceSummary = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!mongoose.isValidObjectId(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID.",
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    // Principal cannot view inactive employee attendance
    if (
      String(req.user.role).toLowerCase() === "principal" &&
      employee.isActive === false
    ) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    const attendance = await EmployeeAttendance.find({
      employee: employeeId,
    }).sort({ date: -1 });

    const present = attendance.filter(
      (item) => item.status === "Present"
    ).length;

    const absent = attendance.filter(
      (item) => item.status === "Absent"
    ).length;

    const leave = attendance.filter(
      (item) => item.status === "Leave"
    ).length;

    const totalDays = attendance.length;

    const percentage = (count) =>
      totalDays > 0
        ? Number(((count / totalDays) * 100).toFixed(1))
        : 0;

    return res.status(200).json({
      success: true,
      employee: {
        _id: employee._id,
        name: employee.name,
        employeeId: employee.employeeId,
        role: employee.role,
      },
      summary: {
        present,
        absent,
        leave,
        totalDays,
        presentPercentage: percentage(present),
        absentPercentage: percentage(absent),
        leavePercentage: percentage(leave),
      },
      data: attendance,
    });
  } catch (error) {
    console.error("Employee Attendance Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve employee attendance summary.",
    });
  }
};
