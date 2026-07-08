import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(2).max(30),

  lastName: z.string().min(2).max(30),

  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),

  email: z.email(),

  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(30).optional(),
  lastName: z.string().min(2).max(30).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  email: z.string().email().optional(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .optional(),
  bio: z.string().max(160).optional(),
  website: z.string().url().optional(),
  location: z.string().optional(),
  avatar: z.string().optional(),
  coverImage: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;