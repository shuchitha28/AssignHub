import express from "express";
import { createTicket, getTickets, replyToTicket, getMyTickets, clearClosedTickets } from "../controllers/supportController";
import { protect } from "../middleware/auth";
import { allowRoles } from "../middleware/role";

const router = express.Router();

router.post("/", protect, createTicket);
router.get("/me", protect, getMyTickets);
router.get("/all", protect, allowRoles("admin"), getTickets);
router.put("/:id/reply", protect, allowRoles("admin"), replyToTicket);
router.delete("/clear-closed", protect, allowRoles("admin"), clearClosedTickets);

export default router;
