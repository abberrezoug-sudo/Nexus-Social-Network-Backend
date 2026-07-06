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

export class AuthService {
  private repo = new AuthRepository();

  async register(payload: RegisterPayload) {
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
  }

  async login(payload: LoginPayload) {
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
