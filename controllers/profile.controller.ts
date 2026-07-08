import type { Response } from "express";
import { AuthService } from "../services/auth.service.js";
import { updateProfileSchema } from "../validators/auth.validator.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

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

    // Profile updates should not change passwords.
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
