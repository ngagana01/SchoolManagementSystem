// const express = require("express");
// const router = express.Router();

// const authMiddleware = require("../middleware/authMiddleware");

// const {
//   getProfile,
//   updateProfile,
// } = require("../controllers/profileController");

// router.get("/", authMiddleware, getProfile);
// router.put("/", authMiddleware, updateProfile);

// module.exports = router;

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const profileUpload = require("../middleware/profileUpload");

const {
  getProfile,
  updateProfile,
} = require("../controllers/profileController");

router.get("/", authMiddleware, getProfile);

router.put(
  "/",
  authMiddleware,
  profileUpload.single("profilePicture"),
  updateProfile
);

module.exports = router;