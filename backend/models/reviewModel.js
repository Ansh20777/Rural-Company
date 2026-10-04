import mongoose from "mongoose";

// A review belongs to EITHER a booking (quick job) OR a job (long job)
const reviewSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

// Unique only when the field exists
reviewSchema.index(
  { booking: 1 },
  { unique: true, partialFilterExpression: { booking: { $exists: true } } }
);
reviewSchema.index(
  { job: 1, worker: 1 },
  { unique: true, partialFilterExpression: { job: { $exists: true } } }
);

const Review = mongoose.model("Review", reviewSchema);
export default Review;
