import express from "express";
import User from "../models/user";
import { protect } from "../middleware/auth";
import { deleteFile } from "../utils/fileUpload";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

router.put("/:id", async (req, res) => {
  const updated = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { returnDocument: 'after' }

  );
  res.json(updated);
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Clean up profile picture from Cloudinary or Local Storage
    if (user.profilePicture) {
      await deleteFile(user.profilePicture);
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User and related media deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Deletion failed" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User exists" });

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Create failed" });
  }
});

router.patch("/:id/status", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Toggle between active and blocked
    user.status = user.status === "active" ? "blocked" : "active";
    user.statusUpdatedBy = (req as any).user?._id;

    await user.save();

    const updatedUser = await User.findById(user._id).populate("statusUpdatedBy", "name email");
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Status update failed" });
  }
});

export default router;