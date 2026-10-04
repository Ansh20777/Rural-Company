import User from "../models/userModel.js";

// UPDATE WORKER PROFILE
export const updateWorkerProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      name,
      phone,
      location,
      profession,
      experience
    } = req.body;

    const worker = await User.findById(userId);

    if (!worker) {
      return res.status(404).json({
        message: "Worker not found"
      });
    }

    if (worker.role !== "worker") {
      return res.status(403).json({
        message: "Only workers can update worker profile"
      });
    }

    if (name !== undefined) {
      worker.name = name;
    }

    if (phone !== undefined) {
      worker.phone = phone;
    }

    if (location !== undefined) {
      worker.location = location;
    }

    if (profession !== undefined) {
      worker.profession = profession;
    }

    if (experience !== undefined) {
      worker.experience = experience;
    }

    // Profile image uploaded using Multer
    if (req.file) {
      // Cloudinary upload will be added here
      console.log(req.file);
    }

    await worker.save();

    const workerData = worker.toObject();

    // Never send password back to client
    delete workerData.password;

    res.status(200).json({
      message: "Worker profile updated successfully",
      worker: workerData
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// GET MY WORKER PROFILE
export const getMyWorkerProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const worker = await User.findById(userId).select("-password");

    if (!worker) {
      return res.status(404).json({
        message: "Worker not found"
      });
    }

    if (worker.role !== "worker") {
      return res.status(403).json({
        message: "Only workers can access this profile"
      });
    }

    res.status(200).json({
      worker
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// GET WORKER BY ID
export const getWorkerById = async (req, res) => {
  try {
    const worker = await User.findOne({
      _id: req.params.id,
      role: "worker"
    }).select("-password");

    if (!worker) {
      return res.status(404).json({
        message: "Worker not found"
      });
    }

    res.status(200).json({
      worker
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// SEARCH WORKERS
export const getWorkers = async (req, res) => {
  try {
    const {
      profession,
      district,
      state,
      available
    } = req.query;

    const filter = {
      role: "worker"
    };

    // Search by profession
    if (profession) {
      filter.profession = {
        $regex: profession,
        $options: "i"
      };
    }

    // Search by district
    if (district) {
      filter["location.district"] = {
        $regex: district,
        $options: "i"
      };
    }

    // Search by state
    if (state) {
      filter["location.state"] = {
        $regex: state,
        $options: "i"
      };
    }

    // Search by availability
    if (available !== undefined) {
      filter.availability = available === "true";
    }

    const workers = await User.find(filter)
      .select("-password")
      .sort({ rating: -1 });

    res.status(200).json({
      count: workers.length,
      workers
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// CHANGE WORKER AVAILABILITY
export const updateAvailability = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { availability } = req.body;

    if (typeof availability !== "boolean") {
      return res.status(400).json({
        message: "Availability must be true or false"
      });
    }

    const worker = await User.findById(userId);

    if (!worker) {
      return res.status(404).json({
        message: "Worker not found"
      });
    }

    if (worker.role !== "worker") {
      return res.status(403).json({
        message: "Only workers can change availability"
      });
    }

    worker.availability = availability;

    await worker.save();

    res.status(200).json({
      message: "Availability updated successfully",
      availability: worker.availability
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};