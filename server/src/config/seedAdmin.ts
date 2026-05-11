import User from "../models/user";

export const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@assignhub.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    const adminExists = await User.findOne({ role: "admin" });

    if (!adminExists) {
      console.log("Seeding default admin...");
      await User.create({
        name: "System Admin",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        status: "active",
      });
      console.log("✅ Default admin created successfully");
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
    } else {
      console.log("ℹ️ Admin already exists, skipping seeding.");
    }
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
  }
};
