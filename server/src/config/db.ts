import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI!, {
      serverSelectionTimeoutMS: 5000,
      family: 4,
    });
    console.log("✅ MongoDB Connected Successfully");
  } catch (error: any) {
    console.error("❌ DB connection failed!");
    console.error(`Error Code: ${error.code}`);
    console.error(`Message: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.error("💡 TIP: Your DNS is blocking 'mongodb+srv'. Please use the 'Standard Connection String' from Atlas (Node.js 2.2.12 format).");
    }
    process.exit(1);
  }
};