import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRepository } from "../repositories/auth.repository.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

const getAccessTokenSecret = () => {
  return process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "dev-access-secret";
};

const authRepository = new AuthRepository();

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

    const decoded = jwt.verify(token, getAccessTokenSecret()) as { id: string };
    const user = await authRepository.findById(decoded.id);

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
