import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    platformName: { type: String, default: "AssignHub" },
    supportEmail: String,
    timezone: String,

    security: {
      googleAuth: { type: Boolean, default: false },
      publicRegistration: { type: Boolean, default: true },
      emailVerification: { type: Boolean, default: false },
      sessionTimeout: { type: Number, default: 30 },
      passwordPolicy: { type: String, default: "strict" },
    },

    branding: {
      primaryColor: { type: String, default: "#ec4899" },
      darkMode: { type: Boolean, default: false },
      logo: String,
    },

    data: {
      backupFrequency: { type: String, default: "weekly" },
      lastBackup: Date,
      autoAcceptEnrollment: { type: Boolean, default: false },
    },

    integrations: {
      awsKey: String,
      awsSecret: String,
      sendgridApi: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Setting", settingSchema);