import mongoose from "mongoose";

// LONG JOB: customer posts it, workers apply, customer selects.
// open -> hired -> completed   (or cancelled)
const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Job title is required"], trim: true },
    description: { type: String, required: [true, "Job description is required"], trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    profession: { type: String, required: [true, "Profession is required"], trim: true },
    skills: [{ type: String, trim: true }],
    location: {
      village: { type: String, trim: true },
      district: { type: String, trim: true, required: true },
      state: { type: String, trim: true, required: true },
    },
    // Where the work is, for distance search. Defaults to the customer's PIN code when the job is posted.
    pinCode: { type: String, trim: true, match: [/^\d{6}$/, "PIN code must contain 6 digits"] },
    jobType: {
      type: String,
      enum: ["hourly", "contract", "part-time", "full-time"],
      required: [true, "Job type is required"],
    },
    duration: { type: String, trim: true },       // e.g. "1 month"
    workingHours: { type: String, trim: true },   // e.g. "9am - 5pm"
    startDate: { type: Date },
    positions: { type: Number, default: 1, min: 1 }, // how many workers needed
    acceptedCount: { type: Number, default: 0, min: 0 }, // workers hired so far; claimed atomically so positions can never be exceeded
    payment: { type: Number, required: [true, "Payment amount is required"], min: 0 },
    paymentUnit: { type: String, enum: ["hour", "day", "month", "total"], default: "month" },
    status: {
      type: String,
      enum: ["open", "hired", "completed", "cancelled"],
      default: "open",
    },
  },
  { timestamps: true }
);

jobSchema.index({ status: 1, "location.district": 1, profession: 1 });
jobSchema.index({ customer: 1, createdAt: -1 });

const Job = mongoose.model("Job", jobSchema);
export default Job;
