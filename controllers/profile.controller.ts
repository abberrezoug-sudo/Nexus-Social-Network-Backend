import type { Response } from "express";
import { AuthService } from "../services/auth.service.js";
import { updateProfileSchema } from "../validators/auth.validator.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";
const authService = new AuthService();

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const parsed = updateProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    // Strip password updates here — profile endpoint should not change password.
    const data = { ...parsed.data } as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(data, "password")) {
      delete data.password;
    }

    const userId = req.user.id;

    const result = await authService.updateProfile(userId, data);
    return res.status(200).json({
      success: true,
      message: result.message,
      user: result.user,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Profile update failed";

    return res.status(400).json({
      success: false,
      message,
    });
  }
};

export const getProfile = async (req: any, res: Response) => {
  try {
    const id = String(req.params.id ?? "");

    if (!id) {
      return res.status(400).json({ success: false, message: "Missing user id" });
    }

    const result = await authService.searchProfileById(id);

    return res.status(200).json({ success: true, message: result.message, user: result.user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch profile";
    return res.status(400).json({ success: false, message });
  }
};

export const uploadAvatar = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const file = (req as any).file as Express.Multer.File | undefined;

    if (!file) {
      return res.status(400).json({ success: false, message: "Aucune image fournie" });
    }

    const imageUrl = await uploadBufferToCloudinary(file.buffer, "avatars", req.user.id);
    const result = await authService.updateAvatar(req.user.id, imageUrl);

    return res.status(200).json({ success: true, message: result.message, avatar: result.avatar });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Échec de l'upload de l'avatar";
    return res.status(400).json({ success: false, message });
  }
};

export const uploadCoverImage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const file = (req as any).file as Express.Multer.File | undefined;

    if (!file) {
      return res.status(400).json({ success: false, message: "Aucune image fournie" });
    }

    const imageUrl = await uploadBufferToCloudinary(file.buffer, "covers", req.user.id);
    const result = await authService.updateCoverImage(req.user.id, imageUrl);

    return res.status(200).json({ success: true, message: result.message, coverImage: result.coverImage });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Échec de l'upload de la cover image";
    return res.status(400).json({ success: false, message });
  }
};
