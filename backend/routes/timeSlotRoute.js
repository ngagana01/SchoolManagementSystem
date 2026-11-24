// const express = require("express");
// const router = express.Router();

// const {
//   getTimeSlots,
//   createTimeSlots,
//   updateTimeSlot,
//   deleteTimeSlot,
// } = require("../controllers/timeSlotController");

// router.get("/", getTimeSlots);
// router.post("/", createTimeSlots);
// router.put("/:id", updateTimeSlot);
// router.delete("/:id", deleteTimeSlot);

// module.exports = router;

const express = require("express");
const router = express.Router();

const {
  getTimeSlots,
  createTimeSlots,
  updateTimeSlot,
  deleteTimeSlot,
} = require("../controllers/timeSlotController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// View time slots
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "principal", "teacher", "student"),
  getTimeSlots
);

// Create time slots
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "teacher"),
  createTimeSlots
);

// Update time slots
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "teacher"),
  updateTimeSlot
);

// Delete time slots
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteTimeSlot
);

module.exports = router;
