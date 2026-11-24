
const Employee = require("../models/Employee");

const User = require("../models/User");


exports.addEmployee = async (req, res) => {
  try {
    const employeeData = { ...req.body };

    if (req.file) {
      employeeData.employeePhoto =
        `/uploads/${req.file.filename}`;
    }

    const employee = await Employee.create(employeeData);

    res.status(201).json({
      success: true,
      message: "Employee added successfully",
      data: employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Employees
// Get All Employees
exports.getAllEmployees = async (req, res) => {
  try {
    const includeInactive =
      req.query.includeInactive === "true" &&
      String(req.user.role).toLowerCase() === "admin";

    const filter = includeInactive
      ? {}
      : { isActive: { $ne: false } };

    const employees = await Employee.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    console.error("Get Employees Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch employees.",
    });
  }
};
// Get Single Employee

// ==========================================
// GET SINGLE EMPLOYEE
// Admin and Principal
// Principal can only view active employees
// ==========================================
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    // Principal cannot view inactive employees
    if (
      String(req.user.role).toLowerCase() === "principal" &&
      employee.isActive === false
    ) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error("Get Employee Details Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch employee details.",
    });
  }
};



// Update Employee
// exports.updateEmployee = async (req, res) => {
//   try {
//     const employee = await Employee.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       {
//         new: true,
//         runValidators: true,
//       }
//     );

//     if (!employee) {
//       return res.status(404).json({
//         success: false,
//         message: "Employee not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Employee updated successfully",
//       data: employee,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

exports.updateEmployee = async (req, res) => {
  try {
    const employeeData = { ...req.body };

    // Change the photo only when a new one is uploaded
    if (req.file) {
      employeeData.employeePhoto =
        `/uploads/${req.file.filename}`;
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      employeeData,
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// // Delete Employee
// // Delete Employee
// exports.deleteEmployee = async (req, res) => {
//   try {
//     const employee = await Employee.findById(req.params.id);

//     if (!employee) {
//       return res.status(404).json({
//         success: false,
//         message: "Employee not found",
//       });
//     }

   
//     await Employee.findByIdAndDelete(req.params.id);

//     res.status(200).json({
//       success: true,
//       message: "Employee and linked login account deleted successfully",
//     });
//   } catch (error) {
//     console.error("Delete Employee Error:", error);

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
// Permanent deletion disabled to preserve employee history
exports.deleteEmployee = async (req, res) => {
  return res.status(403).json({
    success: false,
    message:
      "Permanent employee deletion is disabled. Please deactivate the employee instead.",
  });
};

// ==========================================
// DEACTIVATE EMPLOYEE
// ==========================================
exports.deactivateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    if (!employee.isActive) {
      return res.status(400).json({
        success: false,
        message: "Employee is already inactive.",
      });
    }

    // Deactivate employee record.
    employee.isActive = false;
    await employee.save();

    // Deactivate linked login account, if one exists.
    if (employee.user) {
      await User.findByIdAndUpdate(employee.user, {
        $set: { isActive: false },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee deactivated successfully.",
    });
  } catch (error) {
    console.error("Deactivate Employee Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to deactivate employee.",
    });
  }
};

// ==========================================
// REACTIVATE EMPLOYEE
// ==========================================
exports.reactivateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    if (employee.isActive) {
      return res.status(400).json({
        success: false,
        message: "Employee is already active.",
      });
    }

    employee.isActive = true;
    await employee.save();

    // Reactivate linked login account, if one exists.
    if (employee.user) {
      await User.findByIdAndUpdate(employee.user, {
        $set: { isActive: true },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee reactivated successfully.",
    });
  } catch (error) {
    console.error("Reactivate Employee Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reactivate employee.",
    });
  }
};
// ========================================
// GET MY EMPLOYMENT DETAILS
// Logged-in teacher can view only their record
// ========================================

exports.getMyEmployment = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      user: req.user._id,
    }).select(
      "employeeId name role contact dateOfJoining employeePhoto nationalId gender email dateOfBirth bloodGroup fatherOrHusbandName experience highestQualification address isActive createdAt"
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message:
          "Your employee record is not linked to your login account. Please contact the administrator.",
      });
    }

    return res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error("Get My Employment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve employment details",
      error: error.message,
    });
  }
};