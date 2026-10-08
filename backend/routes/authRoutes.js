import express from "express";
import { registerUser, loginUser, logoutUser, getMe, updateMyProfile } from "../controllers/authController.js";
import authMiddleware from "../middleware/auth.js";
import { authRateLimit } from "../middleware/authRateLimit.js";

const router = express.Router();

router.post("/register", authRateLimit({ windowMs: 60 * 60_000, max: 25, message: "Too many accounts created from this connection. Try again later." }), registerUser);
router.post("/login", authRateLimit({ windowMs: 15 * 60_000, max: 15 }), loginUser);
router.post("/logout", logoutUser);
router.get("/me", authMiddleware, getMe);
router.put("/me", authMiddleware, updateMyProfile);

export default router;
