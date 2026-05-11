import mongoose, { Document } from "mongoose";

export interface ICourse extends Document {
  name: string;
  description: string;
  students: mongoose.Types.ObjectId[];
  pendingStudents: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new mongoose.Schema<ICourse>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    pendingStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<ICourse>("Course", courseSchema);