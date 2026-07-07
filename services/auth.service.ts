import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthRepository } from "../repositories/auth.repository.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

interface RegisterPayload {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

const isDuplicateError = (error: unknown) => {
  if (error instanceof Error) {
    return /duplicate key|already registered|already taken|e11000/i.test(error.message);
  }

  return false;
};

const isDatabaseUnavailableError = (error: unknown) => {
  if (error instanceof Error) {
    return /buffering timed out|topology|econnrefused|enotfound|timed out|server selection|connect/i.test(error.message);
  }

  return false;
};

export class AuthService {
  private repo = new AuthRepository();

  async register(payload: RegisterPayload) {
    try {
      const existingUser = await this.repo.findByEmail(payload.email);

      if (existingUser) {
        throw new Error("Email already registered");
      }

      const existingUsername = await this.repo.findByUsername(payload.username);

      if (existingUsername) {
        throw new Error("Username already taken");
      }

      const hashedPassword = await bcrypt.hash(payload.password, 10);
      const user = await this.repo.create({
        ...payload,
        password: hashedPassword,
      });

      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = generateRefreshToken(user._id.toString());

      return {
        message: "User registered successfully",
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      };
    } catch (error: unknown) {
      if (isDuplicateError(error)) {
        throw new Error("Email or username already registered");
      }

      if (isDatabaseUnavailableError(error)) {
        throw new Error("Database unavailable. Please check your MongoDB connection.");
      }

      throw error;
    }
  }

  async login(payload: LoginPayload) {
    try {
      const user = await this.repo.findByEmail(payload.email);

      if (!user) {
        throw new Error("Invalid credentials");
      }

      const isPasswordValid = await bcrypt.compare(payload.password, user.password);

      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }

      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = generateRefreshToken(user._id.toString());

      return {
        message: "Login successful",
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      };
    } catch (error: unknown) {
      if (isDatabaseUnavailableError(error)) {
        throw new Error("Database unavailable. Please check your MongoDB connection.");
      }

      throw error;
    }
  }

  async refreshToken(token: string) {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as { id: string };
    const user = await this.repo.findById(decoded.id);

    if (!user) {
      throw new Error("Invalid refresh token");
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    return {
      message: "Token refreshed successfully",
      accessToken,
      refreshToken,
    };
  }
}
