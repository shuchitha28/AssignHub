import { Request, Response } from "express";
import SupportTicket from "../models/supportTicket";
import Notification from "../models/notification";

export const createTicket = async (req: any, res: Response) => {
  try {
    const { subject, message } = req.body;
    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject,
      message,
    });
    res.status(201).json(ticket);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTickets = async (req: Request, res: Response) => {
  try {
    const tickets = await SupportTicket.find().populate("user", "name email role");
    res.json(tickets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const replyToTicket = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { reply, adminReplied: true, status: "closed" },
      { returnDocument: 'after' }

    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Create a notification for the user
    await Notification.create({
      recipient: ticket.user,
      sender: req.user._id,
      title: "Support Reply",
      message: `The admin has replied to your request: "${reply}"`,
      type: "support_reply",
      link: "/support", // Placeholder for support page
    });

    res.json(ticket);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyTickets = async (req: any, res: Response) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
export const clearClosedTickets = async (req: Request, res: Response) => {
  try {
    const result = await SupportTicket.deleteMany({ status: "closed" });
    res.json({ message: "Closed tickets cleared successfully", count: result.deletedCount });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
