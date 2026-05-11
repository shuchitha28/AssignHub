import User from "../models/user";
import Setting from "../models/setting";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if public registration is enabled
    const settings = await Setting.findOne();
    if (settings?.security?.publicRegistration === false) {
      return res.status(403).json({ message: "Registration is currently disabled by the administrator." });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      isVerified: settings?.security?.emailVerification === false, // Auto-verify if setting is OFF
      verificationToken: settings?.security?.emailVerification !== false ? crypto.randomBytes(20).toString("hex") : undefined,
    });

    // Send verification email if enabled
    if (settings?.security?.emailVerification !== false && user.verificationToken) {
      let transporter;
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });
      } else {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
      }

      const verifyUrl = `http://localhost:5173/verify-email/${user.verificationToken}?email=${encodeURIComponent(user.email)}`;
      await transporter.sendMail({
        from: `"AssignHub" <${process.env.EMAIL_USER || 'noreply@assignhub.com'}>`,
        to: user.email,
        subject: "Verify your email - AssignHub",
        text: `Please verify your email by clicking the link: ${verifyUrl}`,
        html: `<h3>Welcome to AssignHub!</h3><p>Please click the button below to verify your email:</p><a href="${verifyUrl}" style="padding: 10px 20px; background: #ec4899; color: white; border-radius: 10px; text-decoration: none;">Verify Email</a>`,
      });
    }

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.status !== "active") {
      const statusMsg = user.status === "blocked" ? "blocked" : "deactivated";
      return res.status(403).json({ message: `Your account has been ${statusMsg}. Please contact support.` });
    }

    // Check email verification
    const settings = await Setting.findOne();
    if (settings?.security?.emailVerification !== false && !user.isVerified) {
      return res.status(403).json({ message: "Please verify your email address before logging in." });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is missing");
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      secret,
      { expiresIn: "7d" }
    );

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found with that email address" });
    }

    // Generate token
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Use Gmail if credentials are provided in .env, otherwise fallback to Ethereal test account
    let transporter;
    
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log("Using Ethereal fallback. Preview URL will be logged below.");
    }

    const resetUrl = `http://localhost:5173/reset-password/${token}`;
    
    const info = await transporter.sendMail({
      from: `"AssignHub Support" <${process.env.EMAIL_USER || 'noreply@assignhub.com'}>`,
      to: user.email,
      subject: "Password Reset Link - AssignHub",
      text: `You are receiving this because you requested a password reset.\n\n` +
        `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
        `${resetUrl}\n\n` +
        `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    });

    if (!process.env.EMAIL_USER) {
      console.log("Password Reset Email Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    res.json({ message: "Password reset link sent to your email! (Check server logs for the test link)" });
  } catch (err) {
    console.error("❌ Forgot Password Error:", err);
    res.status(500).json({ message: "Server error during email delivery" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password has been successfully updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { email } = req.query; // Backup check
    
    console.log("🔍 Attempting to verify with token:", token);

    let user = await User.findOne({ verificationToken: token });

    if (!user) {
      // If token not found, check if the email is already verified
      if (email) {
        const alreadyVerifiedUser = await User.findOne({ email: email as string });
        if (alreadyVerifiedUser?.isVerified) {
          console.log("ℹ️ User already verified via backup check.");
          return res.json({ message: "Email is already verified! You can now log in." });
        }
      }
      
      console.log("❌ No user found with that verification token and not verified.");
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    if (user.isVerified) {
      console.log("ℹ️ User is already verified.");
      return res.json({ message: "Email is already verified! You can log in." });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    console.log("✅ Email verified successfully for:", user.email);
    res.json({ message: "Email verified successfully! You can now log in." });
  } catch (err) {
    console.error("❌ Verify Email Error:", err);
    res.status(500).json({ message: "Server error during verification" });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { tokenId, linkOnly } = req.body;
    if (!tokenId) {
      return res.status(400).json({ message: "Token is required" });
    }

    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const { sub: googleId, email, name, picture } = payload;

    // If linkOnly is true, we are linking to the currently logged in user
    if (linkOnly) {
      const currentUserId = (req as any).user?.id;
      if (!currentUserId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const existingUserWithGoogle = await User.findOne({ googleId });
      if (existingUserWithGoogle && existingUserWithGoogle._id.toString() !== currentUserId) {
        return res.status(400).json({ message: "This Google account is already linked to another user" });
      }

      const user = await User.findById(currentUserId);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.googleId = googleId;
      await user.save();
      return res.json({ message: "Google account linked successfully", user });
    }

    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.profilePicture = user.profilePicture || picture || "";
        await user.save();
      }
    } else {
      // Check if public registration is enabled before creating new Google user
      const settings = await Setting.findOne();
      if (settings?.security?.publicRegistration === false) {
        return res.status(403).json({ message: "New account creation is currently disabled." });
      }

      // Create new user (default to student)
      user = await User.create({
        name,
        email,
        googleId,
        profilePicture: picture || "",
        role: "student",
        status: "active",
      });
    }

    if (user.status !== "active") {
      const statusMsg = user.status === "blocked" ? "blocked" : "deactivated";
      return res.status(403).json({ message: `Your account has been ${statusMsg}. Please contact support.` });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is missing");
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      secret,
      { expiresIn: "7d" }
    );

    res.json({ token, user });
  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(500).json({ message: "Google authentication failed" });
  }
};