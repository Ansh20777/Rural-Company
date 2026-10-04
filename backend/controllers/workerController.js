import User from "../models/userModel.js";
import { escapeRegex, getPagination } from "../utils/helpers.js";

// UPDATE WORKER PROFILE
export const updateWorkerProfile = async (req, res) => {
  try {
    const worker = await User.findById(req.user.userId);

    if (!worker) return res.status(404).json({ message: "Worker not found" });
    if (worker.role !== "worker") {
      return res.status(403).json({ message: "Only workers can update worker profile" });
    }

    const fields = [
      "name", "phone", "location", "profession", "experience",
      "bio", "expectedRate", "rateUnit", "skills", "workTypes",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) worker[field] = req.body[field];
    });

    // Profile image uploaded using Multer
    if (req.file) {
      // TODO: upload req.file.buffer to Cloudinary and save the URL in worker.profileImage
      console.log("Image received:", req.file.originalname);
    }

    await worker.save();

    const workerData = worker.toObject();
    delete workerData.password;

    res.status(200).json({ message: "Worker profile updated successfully", worker: workerData });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET MY WORKER PROFILE
export const getMyWorkerProfile = async (req, res) => {
  try {
    const worker = await User.findById(req.user.userId).select("-password");

    if (!worker) return res.status(404).json({ message: "Worker not found" });
    if (worker.role !== "worker") {
      return res.status(403).json({ message: "Only workers can access this profile" });
    }

    res.status(200).json({ worker });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET WORKER BY ID (public - hides email)
export const getWorkerById = async (req, res) => {
  try {
    const worker = await User.findOne({ _id: req.params.id, role: "worker" }).select("-password -email");

    if (!worker) return res.status(404).json({ message: "Worker not found" });

    res.status(200).json({ worker });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// SEARCH WORKERS
// /api/workers?profession=&skill=&district=&state=&available=true&minRate=&maxRate=&minExperience=&workType=&page=&limit=
export const getWorkers = async (req, res) => {
  try {
    const { profession, skill, district, state, available, minRate, maxRate, minExperience, workType } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    const filter = { role: "worker" };

    if (profession) filter.profession = { $regex: escapeRegex(profession), $options: "i" };
    if (skill) filter.skills = { $regex: escapeRegex(skill), $options: "i" };
    if (district) filter["location.district"] = { $regex: escapeRegex(district), $options: "i" };
    if (state) filter["location.state"] = { $regex: escapeRegex(state), $options: "i" };
    if (available !== undefined) filter.availability = available === "true";
    if (workType) filter.workTypes = workType;

    if (minRate || maxRate) {
      filter.expectedRate = {};
      if (minRate) filter.expectedRate.$gte = Number(minRate);
      if (maxRate) filter.expectedRate.$lte = Number(maxRate);
    }

    if (minExperience) filter.experience = { $gte: Number(minExperience) };

    const [workers, total] = await Promise.all([
      User.find(filter)
        .select("-password -email")
        .sort({ rating: -1, reviewCount: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      count: workers.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      workers,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// CHANGE WORKER AVAILABILITY
export const updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;

    if (typeof availability !== "boolean") {
      return res.status(400).json({ message: "Availability must be true or false" });
    }

    const worker = await User.findById(req.user.userId);
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    if (worker.role !== "worker") {
      return res.status(403).json({ message: "Only workers can change availability" });
    }

    worker.availability = availability;
    await worker.save();

    res.status(200).json({ message: "Availability updated successfully", availability: worker.availability });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
