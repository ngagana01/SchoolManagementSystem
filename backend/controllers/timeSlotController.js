const mongoose = require("mongoose");
const TimeSlot = require("../models/TimeSlot");

// Validate a time in HH:mm format.
function isValidTime(value) {
  return (
    typeof value === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
  );
}

// GET /api/time-slots
const getTimeSlots = async (req, res) => {
  try {
    const slots = await TimeSlot.find().sort({ period: 1 });

    return res.status(200).json({
      success: true,
      count: slots.length,
      data: slots,
    });
  } catch (error) {
    console.error("Get time slots error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch time slots.",
    });
  }
};

// POST /api/time-slots
// Accepts either { slots: [...] } or a single slot object.
const createTimeSlots = async (req, res) => {
  try {
    const slots = Array.isArray(req.body.slots)
      ? req.body.slots
      : [req.body];

    if (slots.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one time slot.",
      });
    }

    for (const slot of slots) {
      const period = Number(slot.period);

      if (
        !Number.isInteger(period) ||
        period < 1 ||
        !isValidTime(slot.startTime) ||
        !isValidTime(slot.endTime)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Every slot must have a valid period number, start time, and end time.",
        });
      }

      if (slot.startTime >= slot.endTime) {
        return res.status(400).json({
          success: false,
          message: "End time must be later than start time.",
        });
      }
    }

    const periods = slots.map((slot) => Number(slot.period));

    if (new Set(periods).size !== periods.length) {
      return res.status(400).json({
        success: false,
        message: "Period numbers must be unique.",
      });
    }

    const existing = await TimeSlot.find({
      period: { $in: periods },
    }).select("period");

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Period ${existing[0].period} already exists.`,
      });
    }

    const documents = slots.map((slot) => ({
      period: Number(slot.period),
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));

    const createdSlots = await TimeSlot.insertMany(documents);

    return res.status(201).json({
      success: true,
      message: "Time slots saved successfully.",
      count: createdSlots.length,
      data: createdSlots,
    });
  } catch (error) {
    console.error("Create time slots error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A period with that number already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to save time slots.",
    });
  }
};

// PUT /api/time-slots/:id
const updateTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { period, startTime, endTime } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time slot ID.",
      });
    }

    const numericPeriod = Number(period);

    if (
      !Number.isInteger(numericPeriod) ||
      numericPeriod < 1 ||
      !isValidTime(startTime) ||
      !isValidTime(endTime)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid time slot details.",
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be later than start time.",
      });
    }

    const updatedSlot = await TimeSlot.findByIdAndUpdate(
      id,
      {
        period: numericPeriod,
        startTime,
        endTime,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedSlot) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Time slot updated successfully.",
      data: updatedSlot,
    });
  } catch (error) {
    console.error("Update time slot error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Another time slot already uses that period number.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update time slot.",
    });
  }
};

// DELETE /api/time-slots/:id
const deleteTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time slot ID.",
      });
    }

    const deletedSlot = await TimeSlot.findByIdAndDelete(id);

    if (!deletedSlot) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Time slot deleted successfully.",
      data: deletedSlot,
    });
  } catch (error) {
    console.error("Delete time slot error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete time slot.",
    });
  }
};

module.exports = {
  getTimeSlots,
  createTimeSlots,
  updateTimeSlot,
  deleteTimeSlot,
};