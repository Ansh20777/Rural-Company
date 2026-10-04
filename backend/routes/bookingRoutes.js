import express from "express";
import {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
} from "../controllers/bookingController.js";
import authMiddleware from "../middleware/auth.js";
import requireRole from "../middleware/role.js";

const router = express.Router();

router.post("/", authMiddleware, requireRole("customer"), createBooking); // customer books a worker
router.get("/my", authMiddleware, getMyBookings);                         // customer's / worker's bookings
router.get("/:id", authMiddleware, getBookingById);
router.put("/:id/status", authMiddleware, updateBookingStatus);           // body: { "status": "accepted" }

export default router;
