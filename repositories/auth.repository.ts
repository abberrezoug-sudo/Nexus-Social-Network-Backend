import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import mongoose from "mongoose";
import User from "../models/User.ts";

type StoredUser = {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: "user" | "admin";
};

const storageDir = resolve(process.cwd(), "data");
const storageFilePath = resolve(storageDir, "users.json");
const inMemoryUsers = new Map<string, StoredUser>();

const loadUsersFromDisk = (): StoredUser[] => {
  if (!existsSync(storageFilePath)) {
    return [];
  }

  try {
    const content = readFileSync(storageFilePath, "utf8");
    return JSON.parse(content) as StoredUser[];
  } catch {
    return [];
  }
};

const persistUsersToDisk = (users: Iterable<StoredUser>) => {
  mkdirSync(storageDir, { recursive: true });
  writeFileSync(storageFilePath, JSON.stringify([...users], null, 2));
};

const getFallbackUsers = () => {
  if (inMemoryUsers.size === 0) {
    for (const user of loadUsersFromDisk()) {
      inMemoryUsers.set(user._id, user);
    }
  }

  return inMemoryUsers;
};

const useInMemoryStore = () => {
  const hasMongoUri = Boolean(process.env.MONGODB_URI || process.env.MONGO_URI);
  return !hasMongoUri || mongoose.connection.readyState !== 1;
};

export class AuthRepository {
  async findByEmail(email: string) {
    if (useInMemoryStore()) {
      const user = Array.from(getFallbackUsers().values()).find(
        (entry) => entry.email === email.toLowerCase(),
      );

      return user ? { ...user } : null;
    }

    return User.findOne({ email }).select("+password");
  }

  async findByUsername(username: string) {
    if (useInMemoryStore()) {
      const user = Array.from(getFallbackUsers().values()).find(
        (entry) => entry.username === username.toLowerCase(),
      );

      return user ? { ...user } : null;
    }

    return User.findOne({ username });
  }

  async findById(id: string) {
    if (useInMemoryStore()) {
      const user = getFallbackUsers().get(id);

      if (!user) {
        return null;
      }

      const { password, ...rest } = user;
      return rest;
    }

    return User.findById(id).select("-password");
  }

  async create(data: Record<string, unknown>) {
    if (useInMemoryStore()) {
      const normalizedEmail = String(data.email).toLowerCase();
      const normalizedUsername = String(data.username).toLowerCase();
      const user: StoredUser = {
        _id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        firstName: String(data.firstName),
        lastName: String(data.lastName),
        username: normalizedUsername,
        email: normalizedEmail,
        password: String(data.password),
        role: (data.role as StoredUser["role"]) ?? "user",
      };

      getFallbackUsers().set(user._id, user);
      persistUsersToDisk(getFallbackUsers().values());
      return user;
    }

    return User.create(data);
  }
}