import { Router } from "express";
import { login, logout, me, refresh, register } from "../controllers/auth.controller.js";
import { updateProfile } from "../controllers/profile.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authMiddleware, me);
router.put("/profile", authMiddleware, updateProfile);

export default router;
