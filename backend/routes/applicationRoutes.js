import express from "express";
import {
  getMyApplications, updateApplicationStatus, withdrawApplication,
} from "../controllers/applicationController.js";
import authMiddleware from "../middleware/auth.js";
import requireRole from "../middleware/role.js";

const router = express.Router();

router.get("/my", authMiddleware, requireRole("worker"), getMyApplications);              // keep ABOVE /:id
router.put("/:id/status", authMiddleware, requireRole("customer"), updateApplicationStatus); // accept / reject
router.put("/:id/withdraw", authMiddleware, requireRole("worker"), withdrawApplication);

export default router;
