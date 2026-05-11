import express from "express";
import { protect } from "../middleware/auth";
import { getProfile, updateProfile, changePassword, forgotPassword, supportRequest, unlinkGoogle } from "../controllers/profileController";

const router = express.Router();

router.get("/me", protect, getProfile);
router.put("/update", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/support-request", protect, supportRequest);
router.post("/unlink-google", protect, unlinkGoogle);

export default router;
