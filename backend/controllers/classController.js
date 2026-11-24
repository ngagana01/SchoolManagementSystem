const Class=require("../models/Class");
const addClass = async (req, res) => {
  try {
    const {
      className,
      section,
      boys,
      girls,
      totalStudents,
      boysPercentage,
      girlsPercentage
    } = req.body;

    const newClass = await Class.create({
      className,
      section,
      boys,
      girls,
      totalStudents,
      boysPercentage,
      girlsPercentage
    });

    res.status(201).json(newClass);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
const getClasses = async (req, res) => {
  try {
    const classes = await Class.find();

    res.status(200).json(classes);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
const deleteClass = async (req, res) => {
  try {

    await Class.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      message: "Class deleted"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const updateClass = async (req, res) => {
  try {

    const updatedClass =
      await Class.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    res.status(200).json(updatedClass);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  addClass,
  getClasses,
  deleteClass,
  updateClass
};