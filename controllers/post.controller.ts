// src/controllers/post.controller.ts
import type { Response } from "express";
import { PostService } from "../services/post.service";
import { createPostSchema, updatePostSchema, paginationSchema } from "../validators/post.validator";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";

const postService = new PostService();

export const createPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const parsed = createPostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    let imageUrl: string | undefined;
    const file = (req as any).file as Express.Multer.File | undefined;

    if (file) {
      const publicId = `${req.user.id}-${Date.now()}`;
      imageUrl = await uploadBufferToCloudinary(file.buffer, "posts", publicId);
    }

    const result = await postService.createPost(req.user.id, parsed.data.content, imageUrl);
    return res.status(201).json({ success: true, message: result.message, post: result.post });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Échec de la création du post";
    return res.status(400).json({ success: false, message });
  }
};

export const getFeed = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Paramètres de pagination invalides" });
    }

    const result = await postService.getFeed(parsed.data.page, parsed.data.limit);
    return res.status(200).json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Échec de la récupération du feed";
    return res.status(500).json({ success: false, message });
  }
};

export const getPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id ?? "");
    const result = await postService.getPostById(id);
    return res.status(200).json({ success: true, post: result.post });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Post non trouvé";
    return res.status(404).json({ success: false, message });
  }
};

export const getPostsByUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authorId = String(req.params.userId ?? "");
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Paramètres de pagination invalides" });
    }

    const result = await postService.getPostsByAuthor(authorId, parsed.data.page, parsed.data.limit);
    return res.status(200).json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Échec de la récupération des posts";
    return res.status(500).json({ success: false, message });
  }
};

export const updatePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const id = String(req.params.id ?? "");
    const parsed = updatePostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    const updates = Object.fromEntries(
      Object.entries(parsed.data).filter(([, v]) => v !== undefined)
    ) as unknown as { content?: string; image?: string };

    if (file) {
      const publicId = `${req.user.id}-${Date.now()}`;
      updates.image = await uploadBufferToCloudinary(file.buffer, "posts", publicId);
    }

    const result = await postService.updatePost(id, req.user.id, updates);
    return res.status(200).json({ success: true, message: result.message, post: result.post });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Échec de la mise à jour du post";
    const status = message.includes("Non autorisé") ? 403 : message.includes("non trouvé") ? 404 : 400;
    return res.status(status).json({ success: false, message });
  }
};

export const deletePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const id = String(req.params.id ?? "");
    const result = await postService.deletePost(id, req.user.id);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Échec de la suppression du post";
    const status = message.includes("Non autorisé") ? 403 : message.includes("non trouvé") ? 404 : 400;
    return res.status(status).json({ success: false, message });
  }
};