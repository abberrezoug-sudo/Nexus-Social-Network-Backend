import { Router } from "express";
import { login, logout, me, refresh, register } from "../controllers/auth.controller.js";
import { updateProfile, getProfile } from "../controllers/profile.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authMiddleware, me);
router.put("/profile", authMiddleware, updateProfile);
router.get("/profile/:id", getProfile);

export default router;
