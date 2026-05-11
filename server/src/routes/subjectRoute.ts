import express from "express";
import { createSubject, getSubjects } from "../controllers/subjectController";
import { protect } from "../middleware/auth";
import { allowRoles } from "../middleware/role";

const router = express.Router();

router.get("/", protect, getSubjects);

export default router;