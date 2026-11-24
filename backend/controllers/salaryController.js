
const SalaryPayment = require("../models/SalaryPayment");
const Employee = require("../models/Employee");

// =====================================
// ADMIN: RECORD A SALARY PAYMENT
// =====================================
exports.addSalaryPayment = async (req, res) => {
  try {
    const {
      employeeId,
      month,
      year,
      amount,
      paymentDate,
      paymentMethod,
      remarks,
    } = req.body;

    if (!employeeId || !month || !year || !amount || !paymentDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required salary payment details.",
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than zero.",
      });
    }

    // Calculate how much has already been paid for this month.
    const previousPayments = await SalaryPayment.aggregate([
      {
        $match: {
          employee: employee._id,
          month: Number(month),
          year: Number(year),
        },
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$amount" },
        },
      },
    ]);

    const alreadyPaid = previousPayments[0]?.totalPaid || 0;
    const remainingSalary = Number(employee.monthlySalary) - alreadyPaid;

    if (Number(amount) > remainingSalary) {
      return res.status(400).json({
        success: false,
        message: `Only ₹${Math.max(0, remainingSalary).toFixed(2)} remains for this month.`,
      });
    }

    const payment = await SalaryPayment.create({
      employee: employee._id,
      month: Number(month),
      year: Number(year),
      amount: Number(amount),
      paymentDate,
      paymentMethod: paymentMethod || "Bank Transfer",
      remarks: remarks || "",
    });

    return res.status(201).json({
      success: true,
      message: "Salary payment recorded successfully.",
      data: payment,
    });
  } catch (error) {
    console.error("Add salary payment error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================
// ADMIN / PRINCIPAL: VIEW ALL PAYMENTS
// =====================================
exports.getAllSalaryPayments = async (req, res) => {
  try {
    const payments = await SalaryPayment.find()
      .populate("employee", "name employeeId role monthlySalary")
      .sort({ year: -1, month: -1, paymentDate: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("Get salary payments error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================
// TEACHER: VIEW OWN SALARY
// =====================================
// exports.getMySalary = async (req, res) => {
//   try {
//     const employee = await Employee.findOne({
//       user: req.user._id,
//     }).select("name employeeId role monthlySalary");

//     if (!employee) {
//       return res.status(404).json({
//         success: false,
//         message: "Your employee record is not linked to your login account.",
//       });
//     }

//     const payments = await SalaryPayment.find({
//       employee: employee._id,
//     }).sort({ year: -1, month: -1, paymentDate: -1 });

//     // Group payment transactions by month and year.
//     const monthlyMap = {};

//     payments.forEach((payment) => {
//       const key = `${payment.year}-${String(payment.month).padStart(2, "0")}`;

//       if (!monthlyMap[key]) {
//         monthlyMap[key] = {
//           month: payment.month,
//           year: payment.year,
//           monthlySalary: Number(employee.monthlySalary || 0),
//           paidAmount: 0,
//           payments: [],
//         };
//       }

//       monthlyMap[key].paidAmount += payment.amount;
//       monthlyMap[key].payments.push(payment);
//     });

//     const monthlyHistory = Object.values(monthlyMap)
//       .map((item) => ({
//         ...item,
//         pendingAmount: Math.max(
//           0,
//           item.monthlySalary - item.paidAmount
//         ),
//         status:
//           item.paidAmount >= item.monthlySalary
//             ? "Paid"
//             : item.paidAmount > 0
//             ? "Partial"
//             : "Pending",
//       }))
//       .sort((a, b) => b.year - a.year || b.month - a.month);

//     const totalPaid = payments.reduce(
//       (total, payment) => total + payment.amount,
//       0
//     );

//     return res.status(200).json({
//       success: true,
//       employee: {
//         name: employee.name,
//         employeeId: employee.employeeId,
//         designation: employee.role,
//         monthlySalary: employee.monthlySalary,
//       },
//       summary: {
//         totalPaid,
//         totalPaymentTransactions: payments.length,
//       },
//       monthlyHistory,
//       paymentHistory: payments,
//     });
//   } catch (error) {
//     console.error("Get my salary error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

exports.getMySalary = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      user: req.user._id,
    }).select("name employeeId role monthlySalary dateOfJoining");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Your employee record is not linked to your login account.",
      });
    }

    const payments = await SalaryPayment.find({
      employee: employee._id,
    }).sort({ year: -1, month: -1, paymentDate: -1 });

    const monthlySalary = Number(employee.monthlySalary || 0);

    // Group actual payment transactions by salary month.
    const paymentMap = {};

    payments.forEach((payment) => {
      const key = `${payment.year}-${String(payment.month).padStart(2, "0")}`;

      if (!paymentMap[key]) {
        paymentMap[key] = {
          paidAmount: 0,
          payments: [],
        };
      }

      paymentMap[key].paidAmount += Number(payment.amount || 0);
      paymentMap[key].payments.push(payment);
    });

    // Generate months from the employee's joining month
    // through the current month.
    const now = new Date();

    const startDate = employee.dateOfJoining
      ? new Date(employee.dateOfJoining)
      : now;

    let year = startDate.getFullYear();
    let month = startDate.getMonth() + 1;

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const monthlyHistory = [];

    while (
      year < currentYear ||
      (year === currentYear && month <= currentMonth)
    ) {
      const key = `${year}-${String(month).padStart(2, "0")}`;
      const paidAmount = paymentMap[key]?.paidAmount || 0;
      const pendingAmount = Math.max(0, monthlySalary - paidAmount);

      let status = "Pending";

      if (paidAmount >= monthlySalary) {
        status = "Paid";
      } else if (paidAmount > 0) {
        status = "Partial";
      }

      monthlyHistory.push({
        month,
        year,
        monthlySalary,
        paidAmount,
        pendingAmount,
        status,
        payments: paymentMap[key]?.payments || [],
      });

      // Move to the next month.
      month++;

      if (month > 12) {
        month = 1;
        year++;
      }
    }

    // Newest month first.
    monthlyHistory.reverse();

    const totalPaid = payments.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    );

    const totalPending = monthlyHistory.reduce(
      (total, item) => total + item.pendingAmount,
      0
    );

    return res.status(200).json({
      success: true,

      employee: {
        name: employee.name,
        employeeId: employee.employeeId,
        designation: employee.role,
        monthlySalary,
        dateOfJoining: employee.dateOfJoining,
      },

      summary: {
        totalPaid,
        totalPending,
        totalPaymentTransactions: payments.length,
      },

      monthlyHistory,
      paymentHistory: payments,
    });
  } catch (error) {
    console.error("Get my salary error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
