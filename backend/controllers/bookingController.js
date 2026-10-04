import Booking from "../models/bookingModel.js";
import User from "../models/userModel.js";
import { isValidId } from "../utils/helpers.js";

// Who can move a booking to which status
const transitions = {
  worker: { pending: ["accepted", "rejected"], accepted: ["completed"] },
  customer: { pending: ["cancelled"], accepted: ["cancelled"] },
};

// CREATE BOOKING (customer only)
export const createBooking = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { workerId, description, location, scheduledDate, budget } = req.body;

    if (!workerId || !description || !location) {
      return res.status(400).json({ message: "Worker, description and location are required" });
    }
    if (!isValidId(workerId)) {
      return res.status(400).json({ message: "Invalid worker id" });
    }

    const worker = await User.findOne({ _id: workerId, role: "worker" });
    if (!worker) return res.status(404).json({ message: "Worker not found" });

    if (!worker.availability) {
      return res.status(400).json({ message: "Worker is currently not available" });
    }

    // Stop the customer from spamming the same worker
    const duplicate = await Booking.findOne({
      customer: customerId,
      worker: workerId,
      status: { $in: ["pending", "accepted"] },
    });
    if (duplicate) {
      return res.status(400).json({ message: "You already have an active booking with this worker" });
    }

    const booking = await Booking.create({
      customer: customerId,
      worker: workerId,
      profession: worker.profession,
      description,
      location,
      scheduledDate,
      budget,
      status: "pending",
    });

    res.status(201).json({ message: "Booking request sent to worker", booking });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET MY BOOKINGS (?status=pending optional)
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filter = { $or: [{ customer: userId }, { worker: userId }] };
    if (req.query.status) filter.status = req.query.status;

    const bookings = await Booking.find(filter)
      .populate("customer", "name phone")
      .populate("worker", "name phone profession location rating profileImage availability")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET BOOKING BY ID
export const getBookingById = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const booking = await Booking.findById(req.params.id)
      .populate("customer", "name phone")
      .populate("worker", "name phone profession location rating profileImage");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.customer._id.toString() !== userId && booking.worker._id.toString() !== userId) {
      return res.status(403).json({ message: "You are not allowed to view this booking" });
    }

    res.status(200).json({ booking });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE BOOKING STATUS
// worker:   pending -> accepted | rejected,  accepted -> completed
// customer: pending | accepted -> cancelled
export const updateBookingStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.body;

    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    let actor = null;
    if (booking.worker.toString() === userId) actor = "worker";
    else if (booking.customer.toString() === userId) actor = "customer";
    else return res.status(403).json({ message: "You are not part of this booking" });

    const allowed = transitions[actor][booking.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `A ${actor} cannot change a ${booking.status} booking to ${status}`,
      });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({ message: `Booking ${status}`, booking });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
