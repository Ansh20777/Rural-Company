import { geoFromQuery, withinRadius, CANDIDATE_LIMIT } from "../utils/geo.js";
import User from "../models/userModel.js";
import { escapeRegex, getPagination, handleError, isValidId, isValidImageData, toNumber } from "../utils/helpers.js";

// UPDATE WORKER PROFILE
export const updateWorkerProfile = async (req, res) => {
  try {
    const worker = await User.findById(req.user.userId);

    if (!worker) return res.status(404).json({ message: "Worker not found" });
    if (worker.role !== "worker") {
      return res.status(403).json({ message: "Only workers can update worker profile" });
    }

    if (typeof req.body.profileImage === "string" && !isValidImageData(req.body.profileImage)) {
      return res.status(400).json({ message: "Profile image must be a PNG, JPG, WEBP or GIF under 5 MB" });
    }

    const fields = [
      "name", "age", "phone", "address", "pinCode", "location", "profession", "experience",
      "bio", "expectedRate", "rateUnit", "skills", "workTypes",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) worker[field] = req.body[field];
    });

    // Profile image uploaded using Multer
    if (req.file) {
      if (!/^image\/(png|jpe?g|webp|gif)$/.test(req.file.mimetype)) {
        return res.status(400).json({ message: "Profile image must be a PNG, JPG, WEBP or GIF" });
      }
      worker.profileImage = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    } else if (typeof req.body.profileImage === "string") {
      worker.profileImage = req.body.profileImage;
    }

    await worker.save();

    const workerData = worker.toObject();
    delete workerData.password;

    res.status(200).json({ message: "Worker profile updated successfully", worker: workerData });
  } catch (error) {
    return handleError(res, error);
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
    return handleError(res, error);
  }
};

// GET WORKER BY ID (public - hides email and phone)
export const getWorkerById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid worker id" });

    // Phone is private until a booking is accepted
    const worker = await User.findOne({ _id: req.params.id, role: "worker" }).select("-password -email -phone");

    if (!worker) return res.status(404).json({ message: "Worker not found" });

    res.status(200).json({ worker });
  } catch (error) {
    return handleError(res, error);
  }
};

// SEARCH WORKERS
// /api/workers?profession=&skill=&district=&state=&available=true&minRate=&maxRate=&minExperience=&workType=&page=&limit=
export const getWorkers = async (req, res) => {
  try {
    const { profession, skill, district, state, place, available, minRate, maxRate, minExperience, workType } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    const filter = { role: "worker" };

    if (profession) filter.profession = { $regex: escapeRegex(profession), $options: "i" };
    if (skill) filter.skills = { $regex: escapeRegex(skill), $options: "i" };
    if (district) filter["location.district"] = { $regex: escapeRegex(district), $options: "i" };
    if (state) filter["location.state"] = { $regex: escapeRegex(state), $options: "i" };
    if (place) {
      const pattern = { $regex: escapeRegex(place), $options: "i" };
      filter.$and = [...(filter.$and || []), { $or: [
        { "location.village": pattern }, { "location.district": pattern }, { "location.state": pattern },
      ] }];
    }
    if (available !== undefined) filter.availability = available === "true";
    if (workType) filter.workTypes = workType;

    const minRateN = toNumber(minRate);
    const maxRateN = toNumber(maxRate);
    if (minRateN !== undefined || maxRateN !== undefined) {
      filter.expectedRate = {};
      if (minRateN !== undefined) filter.expectedRate.$gte = minRateN;
      if (maxRateN !== undefined) filter.expectedRate.$lte = maxRateN;
    }

    const minExp = toNumber(minExperience);
    const maxExp = toNumber(req.query.maxExperience);
    if (minExp !== undefined || maxExp !== undefined) {
      filter.experience = {};
      if (minExp !== undefined) filter.experience.$gte = minExp;
      if (maxExp !== undefined) filter.experience.$lte = maxExp;
    }

    if (["hour", "day", "month"].includes(req.query.rateUnit)) filter.rateUnit = req.query.rateUnit;
    if (req.query.q) {
      const pattern = { $regex: escapeRegex(req.query.q), $options: "i" };
      filter.$and = [
        ...(filter.$and || []),
        { $or: [{ name: pattern }, { profession: pattern }, { skills: pattern }, { bio: pattern }] },
      ];
    }

    // Distance search: ?pinCode=781001&radiusKm=30 -> only workers within the radius, nearest first
    const geo = geoFromQuery(req.query);
    if (geo.error) return res.status(400).json({ message: geo.error });

    if (geo.active) {
      const candidates = await User.find(filter).select("-password -email -phone").sort({ rating: -1, reviewCount: -1 }).limit(CANDIDATE_LIMIT);
      const { found, skippedUnknownPin } = withinRadius(candidates, geo, (w) => w.pinCode);
      found.sort((x, y) => x.distanceKm - y.distanceKm); // stable: ties keep the rating order from the query
      const workers = found.slice(skip, skip + limit);
      return res.status(200).json({
        count: workers.length,
        total: found.length,
        page,
        pages: Math.ceil(found.length / limit),
        workers,
        geo: { pinCode: geo.pin, radiusKm: geo.radiusKm, skippedUnknownPin },
      });
    }

    const [workers, total] = await Promise.all([
      User.find(filter)
        .select("-password -email -phone")
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
    return handleError(res, error);
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
    return handleError(res, error);
  }
};
