import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["support_reply", "assignment_graded", "system"], default: "system" },
    read: { type: Boolean, default: false },
    link: { type: String }, // Optional link to redirect user
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1 });

export default mongoose.model("Notification", notificationSchema);
