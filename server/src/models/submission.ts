import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment" },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: String,
    content: String,
    wordCount: Number,
    wpm: Number,
    typedPercentage: Number,
    pastedPercentage: Number,
    typedChars: { type: Number, default: 0 },
    pastedChars: { type: Number, default: 0 },
    fileUrl: String,
    marks: Number,
    submittedAt: { type: Date, default: Date.now },
    feedback: String,
    status: {
      type: String,
      enum: ["submitted", "draft", "reviewed", "revision_requested"],
      default: "draft",
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

submissionSchema.index({ assignment: 1, student: 1 });

export default mongoose.model("Submission", submissionSchema);