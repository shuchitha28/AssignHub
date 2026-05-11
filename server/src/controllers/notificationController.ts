import { Request, Response } from "express";
import Notification from "../models/notification";

export const getMyNotifications = async (req: any, res: Response) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { read: true });
    res.json({ message: "Marked as read" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const clearNotifications = async (req: any, res: Response) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });
    res.json({ message: "Cleared all notifications" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
