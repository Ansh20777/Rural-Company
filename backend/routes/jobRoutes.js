import express from "express";
import {
  createJob, getJobs, getMyJobs, getJobById, updateJobStatus,
} from "../controllers/jobController.js";
import { applyToJob, getJobApplications } from "../controllers/applicationController.js";
import authMiddleware from "../middleware/auth.js";
import requireRole from "../middleware/role.js";

const router = express.Router();

router.get("/", getJobs);                                                    // public search
router.post("/", authMiddleware, requireRole("customer"), createJob);        // post a job
router.get("/my", authMiddleware, requireRole("customer"), getMyJobs);       // keep ABOVE /:id
router.get("/:id", getJobById);
router.put("/:id/status", authMiddleware, requireRole("customer"), updateJobStatus);

router.post("/:id/apply", authMiddleware, requireRole("worker"), applyToJob);
router.get("/:id/applications", authMiddleware, requireRole("customer"), getJobApplications);

export default router;
