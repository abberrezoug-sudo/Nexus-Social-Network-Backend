import { Document, Schema, model } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;

  avatar?: string;
  coverImage?: string;

  bio?: string;
  website?: string;
  location?: string;

  role: "user" | "admin";

  isVerified: boolean;
  isActive: boolean;

  followersCount: number;
  followingCount: number;
  postsCount: number;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    avatar: {
      type: String,
      default: "",
    },

    coverImage: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
      maxlength: 160,
    },

    website: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    followersCount: {
      type: Number,
      default: 0,
    },

    followingCount: {
      type: Number,
      default: 0,
    },

    postsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>("User", userSchema);

export default User;