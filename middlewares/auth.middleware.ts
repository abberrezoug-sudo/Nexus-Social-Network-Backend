import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRepository } from "../repositories/auth.repository.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    avatar: string;
    coverImage: string;
    bio: string;
    website: string;
    location: string;
    role: string;
    isVerified: boolean;
    followersCount: number;
    followingCount: number;
    postsCount: number;
    createdAt: Date;
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

    const profileUser = user as Record<string, unknown>;

    req.user = {
      id: String(profileUser._id ?? profileUser.id ?? ""),
      firstName: String(profileUser.firstName ?? ""),
      lastName: String(profileUser.lastName ?? ""),
      username: String(profileUser.username ?? ""),
      email: String(profileUser.email ?? ""),
      avatar: String(profileUser.avatar ?? ""),
      coverImage: String(profileUser.coverImage ?? ""),
      bio: String(profileUser.bio ?? ""),
      website: String(profileUser.website ?? ""),
      location: String(profileUser.location ?? ""),
      role: String(profileUser.role ?? "user"),
      isVerified: Boolean(profileUser.isVerified ?? false),
      followersCount: Number(profileUser.followersCount ?? 0),
      followingCount: Number(profileUser.followingCount ?? 0),
      postsCount: Number(profileUser.postsCount ?? 0),
      createdAt: profileUser.createdAt instanceof Date ? profileUser.createdAt : new Date(String(profileUser.createdAt ?? Date.now())),
    };

    next();
  } catch (_error) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};
