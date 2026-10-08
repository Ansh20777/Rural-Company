import Application from "../models/applicationModel.js";
import Job from "../models/jobModel.js";
import { isValidId, handleError } from "../utils/helpers.js";

// APPLY TO A JOB (worker only)
export const applyToJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, expectedRate } = req.body;

    if (!isValidId(id)) return res.status(400).json({ message: "Invalid job id" });

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.status !== "open") {
      return res.status(400).json({ message: "This job is no longer accepting applications" });
    }

    try {
      const application = await Application.create({
        job: id,
        worker: req.user.userId,
        message,
        expectedRate,
      });
      res.status(201).json({ message: "Application sent", application });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: "You have already applied to this job" });
      }
      throw err;
    }
  } catch (error) {
    return handleError(res, error);
  }
};

// LIST APPLICANTS FOR A JOB (job owner only)
export const getJobApplications = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) return res.status(400).json({ message: "Invalid job id" });

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.customer.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Only the job owner can see applicants" });
    }

    const applications = await Application.find({ job: id })
      .populate("worker", "name phone profession skills experience expectedRate rateUnit location rating reviewCount profileImage bio")
      .sort({ appliedAt: -1 });

    res.status(200).json({ count: applications.length, job, applications });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    return handleError(res, error);
  }
};

// ACCEPT / REJECT AN APPLICATION (job owner only)
// body: { "status": "accepted" | "rejected" }
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be accepted or rejected" });
    }
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid application id" });
    }

    const existing = await Application.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Application not found" });

    const job = await Job.findById(existing.job);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.customer.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Only the job owner can do this" });
    }

    if (existing.status !== "pending") {
      return res.status(400).json({ message: `Application is already ${existing.status}` });
    }

    let application;
    let jobStatus = job.status;

    if (status === "accepted") {
      if (job.status !== "open") {
        return res.status(400).json({ message: "This job is not open for hiring" });
      }

      // 1) Atomically claim one free position on the job. Only one concurrent request can win the last slot.
      const claimed = await Job.findOneAndUpdate(
        {
          _id: job._id,
          status: "open",
          $or: [{ acceptedCount: { $lt: job.positions } }, { acceptedCount: { $exists: false } }],
        },
        { $inc: { acceptedCount: 1 } },
        { returnDocument: "after" }
      );
      if (!claimed) {
        // Self-heal: if all slots are taken but the job was never flipped to "hired" (e.g. a crash), finish that now
        await Job.updateOne({ _id: job._id, status: "open", acceptedCount: { $gte: job.positions } }, { status: "hired" });
        return res.status(409).json({ message: "All positions for this job have already been filled" });
      }

      // 2) Atomically flip this application pending -> accepted. If someone changed it meanwhile, give the slot back.
      application = await Application.findOneAndUpdate(
        { _id: existing._id, status: "pending" },
        { status: "accepted" },
        { returnDocument: "after" }
      );
      if (!application) {
        await Job.updateOne({ _id: job._id }, { $inc: { acceptedCount: -1 } });
        return res.status(409).json({ message: "This application was just updated. Please refresh." });
      }

      // Safety net (defence in depth): verify the real number of accepted applicants. On MongoDB the atomic counter above
      // already guarantees this never trips; it protects against any store where the claim is not fully atomic.
      const acceptedNow = await Application.countDocuments({ job: job._id, status: "accepted" });
      if (acceptedNow > job.positions) {
        await Application.updateOne({ _id: application._id, status: "accepted" }, { status: "pending" });
        await Job.updateOne({ _id: job._id }, { $inc: { acceptedCount: -1 } });
        return res.status(409).json({ message: "All positions for this job have already been filled" });
      }

      // 3) Last position filled -> job becomes hired and everyone still pending is rejected
      if (claimed.acceptedCount >= claimed.positions) {
        await Job.updateOne({ _id: job._id, status: "open" }, { status: "hired" });
        jobStatus = "hired";
        await Application.updateMany({ job: job._id, status: "pending" }, { status: "rejected" });
      }
    } else {
      application = await Application.findOneAndUpdate(
        { _id: existing._id, status: "pending" },
        { status: "rejected" },
        { returnDocument: "after" }
      );
      if (!application) return res.status(409).json({ message: "This application was just updated. Please refresh." });
    }

    res.status(200).json({ message: `Application ${status}`, application, jobStatus });
  } catch (error) {
    return handleError(res, error);
  }
};

// MY APPLICATIONS (worker)
export const getMyApplications = async (req, res) => {
  try {
    const filter = { worker: req.user.userId };
    if (["pending", "accepted", "rejected", "withdrawn"].includes(req.query.status)) filter.status = req.query.status;

    const applications = await Application.find(filter)
      .populate({
        path: "job",
        populate: { path: "customer", select: "name phone location" },
      })
      .sort({ appliedAt: -1 })
      .lean();

    // Employer phone is only shown once the worker is accepted
    applications.forEach((app) => {
      if (app.status !== "accepted" && app.job?.customer) {
        delete app.job.customer.phone;
      }
    });

    res.status(200).json({ count: applications.length, applications });
  } catch (error) {
    return handleError(res, error);
  }
};

// WITHDRAW APPLICATION (worker, only while pending)
export const withdrawApplication = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid application id" });
    }

    const existing = await Application.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Application not found" });

    if (existing.worker.toString() !== req.user.userId) {
      return res.status(403).json({ message: "This is not your application" });
    }
    if (existing.status !== "pending") {
      return res.status(400).json({ message: `Cannot withdraw a ${existing.status} application` });
    }

    const application = await Application.findOneAndUpdate(
      { _id: existing._id, status: "pending" },
      { status: "withdrawn" },
      { returnDocument: "after" }
    );
    if (!application) return res.status(409).json({ message: "This application was just updated. Please refresh." });

    res.status(200).json({ message: "Application withdrawn", application });
  } catch (error) {
    return handleError(res, error);
  }
};
