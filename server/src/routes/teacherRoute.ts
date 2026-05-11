import express from "express";
import { protect } from "../middleware/auth";
import { allowRoles } from "../middleware/role";
import { getTeacherSubjects, getTeacherCourses } from "../controllers/teacherController";

const router = express.Router();

router.get(
  "/subjects",
  protect,
  allowRoles("teacher"),
  getTeacherSubjects
);

router.get(
  "/courses",
  protect,
  allowRoles("teacher"),
  getTeacherCourses
);

export default router;