import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      trim: true,
    },

    content: {
      type: String,
      default: "",
    },

    wordCount: {
      type: Number,
      default: 0,
    },

    wpm: {
      type: Number,
      default: 0,
    },

    typedPercentage: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },

    pastedPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    typedChars: {
      type: Number,
      default: 0,
    },

    pastedChars: {
      type: Number,
      default: 0,
    },

    fileUrl: String,

    marks: {
      type: Number,
      min: 0,
    },

    feedback: String,

    status: {
      type: String,
      enum: [
        "submitted",
        "draft",
        "reviewed",
        "revision_requested",
      ],
      default: "draft",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    submittedAt: { 
      type: Date, 
    },
  },
  { timestamps: true }
);

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);
