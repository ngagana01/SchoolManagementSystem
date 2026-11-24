const mongoose = require("mongoose");

const ClassSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true
  },

  section: {
    type: String
  },
 boys:{
    type: Number,
    default: 0
  },
  girls:{
    type: Number,
    default: 0
  },
  totalStudents:{
    type: Number,
    default: 0  
  },
  boysPercentage:{
    type: Number,
    default: 0
  },
    girlsPercentage:{
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("Class", ClassSchema);