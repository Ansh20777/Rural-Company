import Booking from "../models/bookingModel.js";
import User from "../models/userModel.js";


// CREATE BOOKING
export const createBooking = async (req, res) => {
  try {
    const customerId = req.user.userId;

    const {
      workerId,
      description,
      location
    } = req.body;

    if (!workerId || !description || !location) {
      return res.status(400).json({
        message: "Worker, description and location are required"
      });
    }

    // Find worker
    const worker = await User.findOne({
      _id: workerId,
      role: "worker"
    });

    if (!worker) {
      return res.status(404).json({
        message: "Worker not found"
      });
    }

    // Check if worker is available
    if (!worker.availability) {
      return res.status(400).json({
        message: "Worker is currently busy"
      });
    }

    // Create booking
    const booking = await Booking.create({
      customer: customerId,
      worker: workerId,
      profession: worker.profession,
      description,
      location,
      status: "open"
    });

    // Worker becomes busy
    worker.availability = false;

    await worker.save();

    res.status(201).json({
      message: "Worker booked successfully",
      booking
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// GET MY BOOKINGS
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.userId;

    const bookings = await Booking.find({
      $or: [
        { customer: userId },
        { worker: userId }
      ]
    })
      .populate("customer", "name phone")
      .populate(
        "worker",
        "name phone profession location rating profileImage availability"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: bookings.length,
      bookings
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// GET BOOKING BY ID
export const getBookingById = async (req, res) => {
  try {
    const userId = req.user.userId;

    const booking = await Booking.findById(req.params.id)
      .populate("customer", "name phone")
      .populate(
        "worker",
        "name phone profession location rating profileImage"
      );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    // Only customer or worker involved can view it
    if (
      booking.customer._id.toString() !== userId &&
      booking.worker._id.toString() !== userId
    ) {
      return res.status(403).json({
        message: "You are not allowed to view this booking"
      });
    }

    res.status(200).json({
      booking
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// CLOSE BOOKING
// Worker finishes the basic job
export const closeBooking = async (req, res) => {
  try {
    const workerId = req.user.userId;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    // Make sure this worker owns the booking
    if (booking.worker.toString() !== workerId) {
      return res.status(403).json({
        message: "You are not the worker for this booking"
      });
    }

    // Already closed
    if (booking.status === "closed") {
      return res.status(400).json({
        message: "Booking is already closed"
      });
    }

    // Close booking
    booking.status = "closed";

    await booking.save();

    // Worker becomes available
    const worker = await User.findById(workerId);

    if (worker) {
      worker.availability = true;
      await worker.save();
    }

    res.status(200).json({
      message: "Booking closed successfully",
      booking
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};