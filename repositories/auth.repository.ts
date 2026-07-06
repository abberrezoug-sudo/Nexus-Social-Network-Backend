import User from "../models/User.ts";

export class AuthRepository {
  async findByEmail(email: string) {
    return User.findOne({ email }).select("+password");
  }

  async findByUsername(username: string) {
    return User.findOne({ username });
  }

  async findById(id: string) {
    return User.findById(id).select("-password");
  }

  async create(data: Record<string, unknown>) {
    return User.create(data);
  }
}