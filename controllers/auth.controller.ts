import type { Response } from "express";
import { AuthService } from "../services/auth.service.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

const authService = new AuthService();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
};

export const register = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await authService.register(parsed.data);
    setAuthCookies(res, result.accessToken, result.refreshToken);

    return res.status(201).json({
      success: true,
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Registration failed";

    return res.status(409).json({
      success: false,
      message,
    });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await authService.login(parsed.data);
    setAuthCookies(res, result.accessToken, result.refreshToken);

    return res.status(200).json({
      success: true,
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Login failed";

    return res.status(401).json({
      success: false,
      message,
    });
  }
};

export const me = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

export const refresh = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const token = req.cookies?.refreshToken ?? req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const result = await authService.refreshToken(token);
    setAuthCookies(res, result.accessToken, result.refreshToken);

    return res.status(200).json({
      success: true,
      message: result.message,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Token refresh failed";

    return res.status(401).json({
      success: false,
      message,
    });
  }
};

export const logout = async (_req: AuthenticatedRequest, res: Response) => {
  clearAuthCookies(res);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
