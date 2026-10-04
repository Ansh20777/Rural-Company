import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer reference is required'],
    },
    profession: {
      type: String,
      required: [true, 'Profession is required'],
      trim: true,
    },
    location: {
      village: { type: String, trim: true },
      district: { type: String, trim: true, required: true },
      state: { type: String, trim: true, required: true },
    },
    jobType: {
      type: String,
      enum: ['hourly', 'contract', 'part-time', 'full-time'],
      required: [true, 'Job type is required'],
    },
    duration: {
      type: String,
      trim: true,
    },
    payment: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Payment cannot be negative'],
    },
    status: {
      type: String,
      enum: ['open', 'hired', 'completed', 'cancelled'],
      default: 'open',
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Index to optimize querying open jobs by profession and location
jobSchema.index({ status: 1, 'location.district': 1, profession: 1 });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;