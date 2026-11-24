const express = require("express");
const router = express.Router();

const {
  getFeeCollectionReport,
} = require("../controllers/feeReportController");

router.get("/", getFeeCollectionReport);

module.exports = router;