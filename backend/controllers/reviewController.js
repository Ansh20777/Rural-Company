import Review from "../models/reviewModel.js";
import Booking from "../models/bookingModel.js";
import User from "../models/userModel.js";

// CREATE REVIEW
export const createReview = async (req, res) => {
  try {
    const customerId = req.user.userId;

    const { bookingId, rating, comment } = req.body;

    if (!bookingId || rating === undefined) {
      return res.status(400).json({
        message: "Booking and rating are required"
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5"
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    // Only the customer of this booking can review
    if (booking.customer.toString() !== customerId) {
      return res.status(403).json({
        message: "Only the customer can review this booking"
      });
    }

    // Booking must be closed
    if (booking.status !== "closed") {
      return res.status(400).json({
        message: "You can review only after the booking is completed"
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      booking: bookingId
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this booking"
      });
    }

    // Create review
    const review = await Review.create({
      booking: bookingId,
      reviewer: customerId,
      worker: booking.worker,
      rating,
      comment
    });

    // Calculate new worker rating
    const reviews = await Review.find({
      worker: booking.worker
    });

    const totalRating = reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );

    const averageRating = totalRating / reviews.length;

    await User.findByIdAndUpdate(
      booking.worker,
      {
        rating: Number(averageRating.toFixed(1))
      }
    );

    res.status(201).json({
      message: "Review added successfully",
      review,
      workerRating: Number(averageRating.toFixed(1))
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// GET WORKER REVIEWS
export const getWorkerReviews = async (req, res) => {
  try {
    const workerId = req.params.workerId;

    const reviews = await Review.find({
      worker: workerId
    })
      .populate("reviewer", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: reviews.length,
      reviews
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};