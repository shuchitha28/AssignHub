import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    code: {
      type: String,
      // Not globally unique — allowed across different courses
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Ensure code is unique only within the same course
subjectSchema.index({ code: 1, course: 1 }, { unique: true, sparse: true });

export default mongoose.model("Subject", subjectSchema);