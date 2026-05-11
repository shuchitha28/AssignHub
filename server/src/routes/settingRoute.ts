import express from "express";
import { getSettings, updateSettings } from "../controllers/settingController";
import { protect } from "../middleware/auth";
import { allowRoles } from "../middleware/role";

const router = express.Router();

router.get("/", getSettings);
router.put("/", protect, allowRoles("admin"), updateSettings);

export default router;