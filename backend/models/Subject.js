// const mongoose = require("mongoose");

// const SubjectSchema = new mongoose.Schema(
//   {
//     className: {
//       type: String,
//       required: true,
//     },
//     section: {
//       type: String,
//       required: true,
//     },

//     subjects: [
//       {
//         subjectName: {
//           type: String,
//           required: true,
//         },

//         subjectTeacher: {
//           type: String,
//           required: true,
//         },

//         marks: {
//           type: Number,
//           required: true,
//         },
//       },
//     ],
//     subjectTeacher: {
//   type: String,
//   required: true,
// },

// teacherUser: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "User",
//   required: true,
// },
//   },
  
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model(
//   "Subject",
//   SubjectSchema
// );


const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      trim: true,
    },

    section: {
      type: String,
      required: true,
      trim: true,
    },

    subjects: [
      {
        subjectName: {
          type: String,
          required: true,
          trim: true,
        },

        // Keep the existing teacher name for display
        subjectTeacher: {
          type: String,
          required: true,
          trim: true,
        },

        // Link the subject to the actual teacher login
        teacherUser: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        marks: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Subject", SubjectSchema);
