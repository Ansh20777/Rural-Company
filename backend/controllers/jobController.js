import Job from "../models/jobModel.js";
import Application from "../models/applicationModel.js";
import { escapeRegex, getPagination, isValidId } from "../utils/helpers.js";

// CREATE JOB (customer only)
export const createJob = async (req, res) => {
  try {
    const {
      title, description, profession, skills, location, jobType,
      duration, workingHours, startDate, positions, payment, paymentUnit,
    } = req.body;

    if (!title || !description || !profession || !location || !jobType || payment === undefined) {
      return res.status(400).json({
        message: "Title, description, profession, location, jobType and payment are required",
      });
    }

    const job = await Job.create({
      title, description, profession, skills, location, jobType,
      duration, workingHours, startDate, positions, payment, paymentUnit,
      customer: req.user.userId,
    });

    res.status(201).json({ message: "Job posted successfully", job });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// SEARCH JOBS (public)
// /api/jobs?q=&profession=&district=&state=&jobType=&minPay=&maxPay=&status=open&page=&limit=
export const getJobs = async (req, res) => {
  try {
    const { q, profession, district, state, jobType, minPay, maxPay, status } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    const filter = { status: status || "open" };

    if (q) filter.title = { $regex: escapeRegex(q), $options: "i" };
    if (profession) filter.profession = { $regex: escapeRegex(profession), $options: "i" };
    if (district) filter["location.district"] = { $regex: escapeRegex(district), $options: "i" };
    if (state) filter["location.state"] = { $regex: escapeRegex(state), $options: "i" };
    if (jobType) filter.jobType = jobType;

    if (minPay || maxPay) {
      filter.payment = {};
      if (minPay) filter.payment.$gte = Number(minPay);
      if (maxPay) filter.payment.$lte = Number(maxPay);
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate("customer", "name location")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Job.countDocuments(filter),
    ]);

    res.status(200).json({
      count: jobs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      jobs,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET MY JOBS (customer) - includes applicant count
export const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ customer: req.user.userId }).sort({ createdAt: -1 }).lean();

    const counts = await Application.aggregate([
      { $match: { job: { $in: jobs.map((j) => j._id) } } },
      { $group: { _id: "$job", total: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.total]));

    const result = jobs.map((job) => ({
      ...job,
      applicationCount: countMap[job._id.toString()] || 0,
    }));

    res.status(200).json({ count: result.length, jobs: result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET JOB BY ID (public)
export const getJobById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid job id" });
    }

    const job = await Job.findById(req.params.id).populate("customer", "name location");
    if (!job) return res.status(404).json({ message: "Job not found" });

    res.status(200).json({ job });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE JOB STATUS (owner only)
// hired -> completed,  open | hired -> cancelled
export const updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid job id" });
    }

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.customer.toString() !== req.user.userId) {
      return res.status(403).json({ message: "You can only update your own jobs" });
    }

    const allowed = { open: ["cancelled"], hired: ["completed", "cancelled"] }[job.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Cannot change a ${job.status} job to ${status}` });
    }

    job.status = status;
    await job.save();

    // If cancelled, close any pending applications
    if (status === "cancelled") {
      await Application.updateMany({ job: job._id, status: "pending" }, { status: "rejected" });
    }

    res.status(200).json({ message: `Job ${status}`, job });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
