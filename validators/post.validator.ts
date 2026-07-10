// src/validators/post.validator.ts
import { z } from "zod";

export const createPostSchema = z.object({
  content: z.string().min(1, "Le contenu est requis").max(500),
});

export const updatePostSchema = z.object({
  content: z.string().min(1).max(500).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});