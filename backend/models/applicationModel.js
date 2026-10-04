import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job reference is required'],
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Worker reference is required'],
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: { createdAt: 'appliedAt', updatedAt: true },
  }
);

// Prevent duplicate applications from the same worker for the same job
applicationSchema.index({ job: 1, worker: 1 }, { unique: true });

// Optimize lookups for worker dashboard and job application tracking
applicationSchema.index({ worker: 1, status: 1 });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;