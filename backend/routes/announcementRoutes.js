const express = require("express");
const router = express.Router();

const {
  createAnnouncement,
  getAnnouncements,
} = require("../controllers/announcementController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Every logged-in user can view announcements
router.get("/", authMiddleware, getAnnouncements);

// Only Admin can publish announcements
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  createAnnouncement
);

module.exports = router;