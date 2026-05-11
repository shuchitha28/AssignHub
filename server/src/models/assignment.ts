import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    totalMarks: Number,
    deadline: Date,
    pdfUrl: String,
    publish: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

assignmentSchema.index({ course: 1, subject: 1 });

export default mongoose.model("Assignment", assignmentSchema);