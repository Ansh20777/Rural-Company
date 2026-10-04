import express from "express";
import { createReview, getWorkerReviews } from "../controllers/reviewController.js";
import authMiddleware from "../middleware/auth.js";
import requireRole from "../middleware/role.js";

const router = express.Router();

router.post("/", authMiddleware, requireRole("customer"), createReview);
router.get("/worker/:workerId", getWorkerReviews);

export default router;
