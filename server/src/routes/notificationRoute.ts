import express from "express";
import { getMyNotifications, markAsRead, clearNotifications } from "../controllers/notificationController";
import { protect } from "../middleware/auth";

const router = express.Router();

router.get("/", protect, getMyNotifications);
router.put("/:id/read", protect, markAsRead);
router.delete("/clear", protect, clearNotifications);

export default router;
