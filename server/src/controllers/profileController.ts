import { Request, Response } from "express";
import User from "../models/user";
import bcrypt from "bcryptjs";
import { saveBase64File, deleteFile } from "../utils/fileUpload";


export const getProfile = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const { 
      name, bio, profilePicture, theme, colorTheme,
      phoneNumber, gender, dob, city, state, country 
    } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (profilePicture !== undefined && profilePicture.startsWith("data:")) {
      // Delete old profile picture if exists
      if (user.profilePicture) {
        await deleteFile(user.profilePicture);
      }
      user.profilePicture = (await saveBase64File(profilePicture)) || undefined;
    }


    if (theme) user.theme = theme as "light" | "dark";
    if (colorTheme) user.colorTheme = colorTheme;
    
    // Additional Personal Info
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (gender !== undefined) user.gender = gender;
    if (dob !== undefined) user.dob = dob;
    if (city !== undefined) user.city = city;
    if (state !== undefined) user.state = state;
    if (country !== undefined) user.country = country;

    await user.save();
    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const changePassword = async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User with this email does not exist" });

    // In a real app, you'd generate a token and send an actual email.
    res.json({ message: "Password reset link sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const supportRequest = async (req: any, res: Response) => {
  try {
    const { subject, message } = req.body;
    const user = req.user;

    console.log(`[SUPPORT] From: ${user.email}, Subject: ${subject}, Message: ${message}`);
    
    // Simulate sending support email
    res.json({ message: "Support request sent successfully. We will get back to you soon!" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
export const unlinkGoogle = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Ensure the user has a password before unlinking Google, so they don't get locked out
    if (!user.password && user.googleId) {
      return res.status(400).json({ message: "You must set a password before unlinking your Google account" });
    }

    user.googleId = undefined;
    await user.save();

    res.json({ message: "Google account unlinked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
