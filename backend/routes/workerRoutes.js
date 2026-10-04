import express from "express";
import multer from "multer";

import authMiddleware from "../middleware/auth.js";
import {
  updateWorkerProfile,
  getMyWorkerProfile,
  getWorkerById,
  getWorkers,
  updateAvailability,
} from "../controllers/workerController.js";

const router = express.Router();

// Multer: store uploaded image temporarily in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

// Search workers
// GET /api/workers?profession=plumber&district=Nagaon&state=Assam
// Other filters: skill, available, minRate, maxRate, minExperience, workType, page, limit
router.get("/", getWorkers);

// Get logged-in worker's profile
// GET /api/workers/me
router.get("/me", authMiddleware, getMyWorkerProfile);

// Update logged-in worker's profile
// PUT /api/workers/me
router.put(
  "/me",
  authMiddleware,
  upload.single("profileImage"),
  updateWorkerProfile
);
// Get a specific worker
// GET /api/workers/:id
router.get("/:id", getWorkerById);


// Update worker availability
// PUT /api/workers/me/availability
router.put(
  "/me/availability",
  authMiddleware,
  updateAvailability
);

export default router;