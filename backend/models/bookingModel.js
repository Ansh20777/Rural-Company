import mongoose from "mongoose";

// QUICK JOB: customer picks a worker directly.
// pending -> accepted -> completed   (or rejected / cancelled)
const bookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    profession: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    location: { village: String, district: String, state: String },
    scheduledDate: { type: Date },
    budget: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ worker: 1, status: 1 });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
