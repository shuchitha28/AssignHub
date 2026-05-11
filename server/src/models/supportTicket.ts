import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    reply: { type: String },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    adminReplied: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("SupportTicket", supportTicketSchema);
