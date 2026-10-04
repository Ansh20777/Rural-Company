import express from "express";
import {
  registerUser,
  loginUser
} from "../controllers/authController.js";

import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.get("/login", loginUser);

export default router;