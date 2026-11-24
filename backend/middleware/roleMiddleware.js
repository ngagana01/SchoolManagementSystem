
// const roleMiddleware = (...allowedRoles) => {
//   return (req, res, next) => {
//     try {
//       if (!req.user) {
//         return res.status(401).json({
//           success: false,
//           message: "Please login first",
//         });
//       }

//       if (!allowedRoles.includes(req.user.role)) {
//         return res.status(403).json({
//           success: false,
//           message: "You are not authorized to access this resource",
//         });
//       }

//       next();
//     } catch (error) {
//       return res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   };
// };

// module.exports = roleMiddleware;

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check whether the user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Please login first",
        });
      }

      // Normalize role names
      const userRole = String(req.user.role || "")
        .trim()
        .toLowerCase();

      const permittedRoles = allowedRoles.map((role) =>
        String(role).trim().toLowerCase()
      );

      // Check role permission
      if (!permittedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to access this resource",
        });
      }

      next();
    } catch (error) {
      console.error("Role Middleware Error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
};

module.exports = roleMiddleware;
