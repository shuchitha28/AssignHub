import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  role: "admin" | "teacher" | "student";
  status: "active" | "inactive" | "blocked";
  course?: mongoose.Types.ObjectId;
  bio?: string;
  profilePicture?: string;
  theme?: "light" | "dark";
  colorTheme?: string;
  phoneNumber?: string;
  gender?: string;
  dob?: string;
  city?: string;
  state?: string;
  country?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isVerified: boolean;
  verificationToken?: string;
  statusUpdatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: function (this: any) {
        return !this.googleId;
      },
      minlength: 6,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      default: "student",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    bio: {
      type: String,
      default: "",
    },
    profilePicture: {
      type: String,
      default: "",
    },
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    colorTheme: {
      type: String,
      default: "pink",
    },
    phoneNumber: { type: String, default: "" },
    gender: { type: String, default: "" },
    dob: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    statusUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);


userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
});

userSchema.methods.comparePassword = async function (password: string) {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>("User", userSchema);