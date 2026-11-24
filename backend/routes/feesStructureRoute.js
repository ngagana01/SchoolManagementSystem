const express = require("express");
const router = express.Router();

const {
  createFeesStructure,
  getAllFeesStructures,
  deleteFeesStructure,
} = require("../controllers/feesStructureController");

// Create fees structure
router.post("/", createFeesStructure);

// Get all fees structures
router.get("/", getAllFeesStructures);

// Delete a fees structure
router.delete("/:id", deleteFeesStructure);

module.exports = router;