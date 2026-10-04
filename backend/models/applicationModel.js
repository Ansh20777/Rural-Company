import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, trim: true, default: "" },
    expectedRate: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },
  },
  { timestamps: { createdAt: "appliedAt", updatedAt: true } }
);

// One application per worker per job
applicationSchema.index({ job: 1, worker: 1 }, { unique: true });
applicationSchema.index({ worker: 1, status: 1 });

const Application = mongoose.model("Application", applicationSchema);
export default Application;
