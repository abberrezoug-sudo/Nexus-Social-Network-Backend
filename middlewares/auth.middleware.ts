import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.ts";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (_error) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};
