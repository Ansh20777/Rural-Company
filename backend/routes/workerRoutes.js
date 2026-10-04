import express from "express";

import {
  updateWorkerProfile,
  getMyWorkerProfile,
  getWorkerById,
  getWorkers,
  updateAvailability
} from "../controllers/workerController.js";

import authMiddleware from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();


// WORKER ROUTES

// Update own profile + upload profile image
router.put(
  "/profile",
  authMiddleware,
  upload.single("profileImage"),
  updateWorkerProfile
);


// Get own profile
router.get(
  "/profile",
  authMiddleware,
  getMyWorkerProfile
);


// Change availability
router.put(
  "/availability",
  authMiddleware,
  updateAvailability
);


// CUSTOMER / PUBLIC ROUTES

// Search workers
router.get(
  "/",
  getWorkers
);


// Get worker by ID
router.get(
  "/:id",
  getWorkerById
);


export default router;