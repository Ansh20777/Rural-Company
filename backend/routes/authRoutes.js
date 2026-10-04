import express from "express";
import { registerUser, loginUser, getMe, updateMyProfile } from "../controllers/authController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);          // was GET before - must be POST
router.get("/me", authMiddleware, getMe);
router.put("/me", authMiddleware, updateMyProfile);

export default router;
