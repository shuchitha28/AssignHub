import jwt from "jsonwebtoken";
import User from "../models/user";

export const protect = async (req: any, res: any, next: any) => {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer")) {
      return res.status(401).json({ message: "No token" });
    }

    const token = auth.split(" ")[1];

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error("❌ AUTH ERROR:", (err as Error).message);
    return res.status(401).json({ message: "Invalid token" });
  }
};