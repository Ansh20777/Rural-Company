import jwt from "jsonwebtoken";
import { geoFromQuery, withinRadius, CANDIDATE_LIMIT } from "../utils/geo.js";
import User from "../models/userModel.js";
import Job from "../models/jobModel.js";
import Application from "../models/applicationModel.js";
import { escapeRegex, getPagination, isValidId, handleError, toNumber } from "../utils/helpers.js";

// CREATE JOB (customer only)
export const createJob = async (req, res) => {
  try {
    const {
      title, description, profession, skills, location, jobType,
      duration, workingHours, startDate, positions, payment, paymentUnit, pinCode,
    } = req.body;

    if (!title || !description || !profession || !location || !jobType || payment === undefined || payment === "") {
      return res.status(400).json({
        message: "Title, description, profession, location, jobType and payment are required",
      });
    }

    // The job's PIN code (for distance search) defaults to the poster's own PIN code
    let jobPin = typeof pinCode === "string" && pinCode.trim() ? pinCode.trim() : undefined;
    if (!jobPin) jobPin = (await User.findById(req.user.userId).select("pinCode"))?.pinCode || undefined;

    const job = await Job.create({
      title, description, profession, skills, location, jobType,
      duration, workingHours, startDate, positions, payment, paymentUnit, pinCode: jobPin,
      customer: req.user.userId,
    });

    res.status(201).json({ message: "Job posted successfully", job });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return handleError(res, error);
  }
};

// SEARCH JOBS (public)
// /api/jobs?q=&profession=&district=&state=&jobType=&minPay=&maxPay=&status=open&page=&limit=
export const getJobs = async (req, res) => {
  try {
    const { q, profession, district, state, place, jobType, minPay, maxPay } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    const filter = { status: "open" };

    if (q) {
      const pattern = { $regex: escapeRegex(q), $options: "i" };
      filter.$or = [{ title: pattern }, { description: pattern }];
    }
    if (profession) filter.profession = { $regex: escapeRegex(profession), $options: "i" };
    if (district) filter["location.district"] = { $regex: escapeRegex(district), $options: "i" };
    if (state) filter["location.state"] = { $regex: escapeRegex(state), $options: "i" };
    if (place) {
      const placePattern = { $regex: escapeRegex(place), $options: "i" };
      filter.$and = [...(filter.$and || []), { $or: [
        { "location.village": placePattern }, { "location.district": placePattern }, { "location.state": placePattern },
      ] }];
    }
    if (jobType) filter.jobType = jobType;

    const minPayN = toNumber(minPay);
    const maxPayN = toNumber(maxPay);
    if (minPayN !== undefined || maxPayN !== undefined) {
      filter.payment = {};
      if (minPayN !== undefined) filter.payment.$gte = minPayN;
      if (maxPayN !== undefined) filter.payment.$lte = maxPayN;
    }

    // Distance search: ?pinCode=781001&radiusKm=30 -> only jobs within the radius, nearest first
    const geo = geoFromQuery(req.query);
    if (geo.error) return res.status(400).json({ message: geo.error });

    if (geo.active) {
      const candidates = await Job.find(filter).populate("customer", "name location pinCode").sort({ createdAt: -1 }).limit(CANDIDATE_LIMIT);
      const { found, skippedUnknownPin } = withinRadius(candidates, geo, (j) => j.pinCode || j.customer?.pinCode);
      found.sort((x, y) => x.distanceKm - y.distanceKm);
      const jobs = found.slice(skip, skip + limit);
      return res.status(200).json({
        count: jobs.length,
        total: found.length,
        page,
        pages: Math.ceil(found.length / limit),
        jobs,
        geo: { pinCode: geo.pin, radiusKm: geo.radiusKm, skippedUnknownPin },
      });
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
    return handleError(res, error);
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
    return handleError(res, error);
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

    // Non-open jobs are visible only to their owner
    if (job.status !== "open") {
      let viewerId = null;
      try {
        const header = req.headers.authorization || "";
        if (header.startsWith("Bearer ")) viewerId = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET).userId;
      } catch { /* not logged in */ }
      if (!viewerId || job.customer?._id?.toString() !== String(viewerId)) {
        return res.status(404).json({ message: "Job not found" });
      }
    }

    res.status(200).json({ job });
  } catch (error) {
    return handleError(res, error);
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

    const existing = await Job.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Job not found" });

    if (existing.customer.toString() !== req.user.userId) {
      return res.status(403).json({ message: "You can only update your own jobs" });
    }

    const transitions = { open: ["cancelled"], hired: ["completed", "cancelled"] };
    const fromStatuses = Object.keys(transitions).filter((from) => transitions[from].includes(status));
    if (!fromStatuses.includes(existing.status)) {
      return res.status(400).json({ message: `Cannot change a ${existing.status} job to ${status}` });
    }

    // Atomic: only succeeds if the job is still in the status we just checked
    const job = await Job.findOneAndUpdate(
      { _id: existing._id, customer: req.user.userId, status: existing.status },
      { status },
      { returnDocument: "after" }
    );
    if (!job) return res.status(409).json({ message: "This job was just updated. Please refresh and try again." });

    // If cancelled, close any pending applications (idempotent, safe to retry)
    if (status === "cancelled") {
      await Application.updateMany({ job: job._id, status: "pending" }, { status: "rejected" });
    }

    res.status(200).json({ message: `Job ${status}`, job });
  } catch (error) {
    return handleError(res, error);
  }
};
