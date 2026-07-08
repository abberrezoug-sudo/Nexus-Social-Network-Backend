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

const getEntityId = (entity: unknown) => {
  if (!entity || typeof entity !== "object") {
    return "";
  }

  const record = entity as { _id?: unknown; id?: unknown };
  return String(record._id ?? record.id ?? "");
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

  async updateProfile(userId: string, updateData: Record<string, unknown>) {
    try {
      if (updateData.email) {
        const existing = await this.repo.findByEmail(String(updateData.email));

        if (existing) {
          const existingId = getEntityId(existing);
          if (existingId && existingId !== String(userId)) {
            throw new Error("Email already taken");
          }
        }
      }

      if (updateData.username) {
        const existingUsername = await this.repo.findByUsername(String(updateData.username));

        if (existingUsername) {
          const existingUsernameId = getEntityId(existingUsername);
          if (existingUsernameId && existingUsernameId !== String(userId)) {
            throw new Error("Username already taken");
          }
        }
      }

      // Do not allow password updates through the profile endpoint here.
      if (updateData.password) {
        delete updateData.password;
      }

      const updated = await this.repo.updateById(userId, updateData);

      if (!updated) {
        throw new Error("User not found");
      }

      const profile = updated as Record<string, unknown>;

      return {
        message: "Profile updated successfully",
        user: {
          id: String(profile._id ?? profile.id ?? userId),
          firstName: String(profile.firstName ?? ""),
          lastName: String(profile.lastName ?? ""),
          username: String(profile.username ?? ""),
          email: String(profile.email ?? ""),
          role: String(profile.role ?? "user"),
          avatar: String(profile.avatar ?? ""),
          coverImage: String(profile.coverImage ?? ""),
          bio: String(profile.bio ?? ""),
          website: String(profile.website ?? ""),
          location: String(profile.location ?? ""),
        },
      };
    } catch (error: unknown) {
      if (isDatabaseUnavailableError(error)) {
        throw new Error("Database unavailable. Please check your MongoDB connection.");
      }

      throw error;
    }
  }
}
