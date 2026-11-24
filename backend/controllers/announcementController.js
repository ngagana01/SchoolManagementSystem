const Announcement = require("../models/Announcement");

// ADMIN: Create announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title and announcement message are required",
      });
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Announcement published successfully",
      data: announcement,
    });
  } catch (error) {
    console.error("Create announcement error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to publish announcement",
    });
  }
};

// ALL LOGGED-IN USERS: View announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    console.error("Get announcements error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load announcements",
    });
  }
};