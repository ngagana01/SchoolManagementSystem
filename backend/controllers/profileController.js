
// const User = require("../models/User");

// // GET logged-in user's profile
// const getProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id)
//       .select("-password");

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // UPDATE logged-in user's profile
// const updateProfile = async (req, res) => {
//   try {
//     const { name, email } = req.body;

//     if (
//       typeof name !== "string" ||
//       !name.trim() ||
//       typeof email !== "string" ||
//       !email.trim()
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid name and email are required",
//       });
//     }

//     const normalizedEmail = email.trim().toLowerCase();

//     const existingUser = await User.findOne({
//       email: normalizedEmail,
//       _id: { $ne: req.user._id },
//     });

//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: "Email is already in use",
//       });
//     }

//     const user = await User.findByIdAndUpdate(
//       req.user._id,
//       {
//         name: name.trim(),
//         email: normalizedEmail,
//       },
//       {
//         new: true,
//         runValidators: true,
//       }
//     ).select("-password");

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Profile updated successfully",
//       data: user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// module.exports = {
//   getProfile,
//   updateProfile,
// };
const User = require("../models/User");

// GET logged-in user's profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE logged-in user's profile

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid name and email are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user._id },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already in use",
      });
    }

    const updateData = {
      name: name.trim(),
      email: normalizedEmail,
    };

    // Update profile picture only when a new image is uploaded.
    if (req.file) {
      updateData.profilePicture =
        `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = {
  getProfile,
  updateProfile,
};