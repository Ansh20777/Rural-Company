import Application from "../models/applicationModel.js";
import Job from "../models/jobModel.js";
import { isValidId } from "../utils/helpers.js";

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
        return res.status(400).json({ message: "You have already applied to this job" });
      }
      throw err;
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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
    res.status(500).json({ message: "Server error", error: error.message });
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

    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found" });

    const job = await Job.findById(application.job);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.customer.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Only the job owner can do this" });
    }

    if (application.status !== "pending") {
      return res.status(400).json({ message: `Application is already ${application.status}` });
    }

    if (status === "accepted") {
      if (job.status !== "open") {
        return res.status(400).json({ message: "This job is not open for hiring" });
      }

      const acceptedCountBefore = await Application.countDocuments({ job: job._id, status: "accepted" });
      if (acceptedCountBefore >= job.positions) {
        return res.status(409).json({ message: "All positions for this job have already been filled" });
      }

      application.status = "accepted";
      await application.save();

      // When all positions are filled -> job is hired and everyone else is rejected
      const acceptedCount = await Application.countDocuments({ job: job._id, status: "accepted" });
      if (acceptedCount >= job.positions) {
        job.status = "hired";
        await job.save();
        await Application.updateMany({ job: job._id, status: "pending" }, { status: "rejected" });
      }
    } else {
      application.status = "rejected";
      await application.save();
    }

    res.status(200).json({ message: `Application ${status}`, application, jobStatus: job.status });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// MY APPLICATIONS (worker)
export const getMyApplications = async (req, res) => {
  try {
    const filter = { worker: req.user.userId };
    if (req.query.status) filter.status = req.query.status;

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
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// WITHDRAW APPLICATION (worker, only while pending)
export const withdrawApplication = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid application id" });
    }

    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found" });

    if (application.worker.toString() !== req.user.userId) {
      return res.status(403).json({ message: "This is not your application" });
    }
    if (application.status !== "pending") {
      return res.status(400).json({ message: `Cannot withdraw a ${application.status} application` });
    }

    application.status = "withdrawn";
    await application.save();

    res.status(200).json({ message: "Application withdrawn", application });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
