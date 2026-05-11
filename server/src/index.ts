import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import fs from "fs";


import authRoutes from "./routes/authRoute";
import courseRoutes from "./routes/courseRoute";
import userRoutes from "./routes/userRoute";
import settingsRoutes from "./routes/settingRoute";
import dashboardRoutes from "./routes/dashboardRoute";
import assignmentRoutes from "./routes/assignmentRoute";
import teacherRoutes from "./routes/teacherRoute";
import profileRoutes from "./routes/profileRoute";
import supportRoutes from "./routes/supportRoute";
import notificationRoutes from "./routes/notificationRoute";
import { seedAdmin } from "./config/seedAdmin";


import { errorHandler } from "./middleware/error";

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve Static Files
const uploadsPath = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}
app.use("/uploads", express.static(uploadsPath));


/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/notifications", notificationRoutes);

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.send("API Running...");
});

/* ================= ERROR HANDLER ================= */
app.use(errorHandler);

/* ================= DB CONNECT ================= */
mongoose
  .connect(process.env.MONGO_URI!)
  .then(async () => {
    console.log("✅ DB connected");

    try {
      await mongoose.connection.collection("subjects").dropIndex("code_1");
      console.log("✅ Dropped legacy unique index on subjects.code");
    } catch {
    }

    await seedAdmin();

    app.listen(5000, () =>
      console.log("🚀 Server running on http://localhost:5000")
    );
  })
  .catch((err) => {
    console.error("❌ DB connection failed", err);
  });