import express from "express";

import {
  createBooking,
  getMyBookings,
  getBookingById,
  closeBooking
} from "../controllers/bookingController.js";

import authMiddleware from "../middleware/auth.js";

const router = express.Router();


// Customer books a worker
router.post(
  "/",
  authMiddleware,
  createBooking
);


// Get customer's/worker's bookings
router.get(
  "/my",
  authMiddleware,
  getMyBookings
);


// Get one booking
router.get(
  "/:id",
  authMiddleware,
  getBookingById
);


// Worker finishes the job
router.put(
  "/:id/close",
  authMiddleware,
  closeBooking
);


export default router;