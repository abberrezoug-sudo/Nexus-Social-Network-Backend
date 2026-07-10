// src/routes/post.routes.ts
import { Router } from "express";
import {
  createPost,
  getFeed,
  getPost,
  getPostsByUser,
  updatePost,
  deletePost,
} from "../controllers/post.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

router.post("/", authMiddleware, upload.single("image"), createPost);
router.get("/feed", authMiddleware, getFeed);
router.get("/user/:userId", getPostsByUser);
router.get("/:id", getPost);
router.put("/:id", authMiddleware, upload.single("image"), updatePost);
router.delete("/:id", authMiddleware, deletePost);

export { router as postRoutes };
export default router;