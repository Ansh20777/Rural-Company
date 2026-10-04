import express from "express";

import {
  createReview,
  getWorkerReviews
} from "../controllers/reviewController.js";

import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  createReview
);

router.get(
  "/worker/:workerId",
  getWorkerReviews
);

export default router;