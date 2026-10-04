import Review from "../models/reviewModel.js";
import Booking from "../models/bookingModel.js";
import Job from "../models/jobModel.js";
import Application from "../models/applicationModel.js";
import User from "../models/userModel.js";
import { isValidId } from "../utils/helpers.js";

// Recalculate the worker's average rating
const updateWorkerRating = async (workerId) => {
  const reviews = await Review.find({ worker: workerId });
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  const average = reviews.length ? Number((total / reviews.length).toFixed(1)) : 0;

  await User.findByIdAndUpdate(workerId, { rating: average, reviewCount: reviews.length });
  return average;
};

// CREATE REVIEW (customer only)
// Quick job:  { bookingId, rating, comment }
// Long job:   { jobId, workerId, rating, comment }
export const createReview = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { bookingId, jobId, workerId, rating, comment } = req.body;

    if (rating === undefined || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }
    if (!bookingId && !jobId) {
      return res.status(400).json({ message: "Provide bookingId or jobId" });
    }

    let reviewData;

    if (bookingId) {
      // ---------- QUICK JOB ----------
      if (!isValidId(bookingId)) return res.status(400).json({ message: "Invalid booking id" });

      const booking = await Booking.findById(bookingId);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      if (booking.customer.toString() !== customerId) {
        return res.status(403).json({ message: "Only the customer can review this booking" });
      }
      if (booking.status !== "completed") {
        return res.status(400).json({ message: "You can review only after the booking is completed" });
      }
      if (await Review.findOne({ booking: bookingId })) {
        return res.status(400).json({ message: "You have already reviewed this booking" });
      }

      reviewData = { booking: bookingId, worker: booking.worker };
    } else {
      // ---------- LONG JOB ----------
      if (!isValidId(jobId) || !isValidId(workerId)) {
        return res.status(400).json({ message: "Valid jobId and workerId are required" });
      }

      const job = await Job.findById(jobId);
      if (!job) return res.status(404).json({ message: "Job not found" });

      if (job.customer.toString() !== customerId) {
        return res.status(403).json({ message: "Only the job owner can review" });
      }
      if (job.status !== "completed") {
        return res.status(400).json({ message: "You can review only after the job is completed" });
      }

      const hired = await Application.findOne({ job: jobId, worker: workerId, status: "accepted" });
      if (!hired) {
        return res.status(400).json({ message: "This worker was not hired for this job" });
      }
      if (await Review.findOne({ job: jobId, worker: workerId })) {
        return res.status(400).json({ message: "You have already reviewed this worker for this job" });
      }

      reviewData = { job: jobId, worker: workerId };
    }

    const review = await Review.create({ ...reviewData, reviewer: customerId, rating, comment });
    const workerRating = await updateWorkerRating(reviewData.worker);

    res.status(201).json({ message: "Review added successfully", review, workerRating });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET WORKER REVIEWS (public)
export const getWorkerReviews = async (req, res) => {
  try {
    if (!isValidId(req.params.workerId)) {
      return res.status(400).json({ message: "Invalid worker id" });
    }

    const reviews = await Review.find({ worker: req.params.workerId })
      .populate("reviewer", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: reviews.length, reviews });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
