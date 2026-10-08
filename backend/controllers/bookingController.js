import Booking from "../models/bookingModel.js";
import User from "../models/userModel.js";
import { isValidId, handleError } from "../utils/helpers.js";

// Who can move a booking to which status
const transitions = {
  worker: { pending: ["accepted", "rejected"], accepted: ["completed"] },
  customer: { pending: ["cancelled"], accepted: ["cancelled"] },
};

// Each side only sees the other person's phone once the booking is accepted (or completed)
const withPrivatePhones = (bookingDoc, userId) => {
  const booking = bookingDoc.toObject ? bookingDoc.toObject() : bookingDoc;
  if (!["accepted", "completed"].includes(booking.status)) {
    const id = (x) => (x?._id || x)?.toString();
    if (booking.customer && id(booking.customer) !== userId) delete booking.customer.phone;
    if (booking.worker && id(booking.worker) !== userId) delete booking.worker.phone;
  }
  return booking;
};

// CREATE BOOKING (customer only)
export const createBooking = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { workerId, description, location, scheduledDate, budget } = req.body;

    if (!workerId || typeof description !== "string" || !description.trim() || !location || typeof location !== "object") {
      return res.status(400).json({ message: "Worker, description and location are required" });
    }
    if (String(workerId) === String(customerId)) {
      return res.status(400).json({ message: "You cannot book yourself" });
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
      return res.status(409).json({ message: "You already have an active booking with this worker" });
    }

    let booking;
    try {
      booking = await Booking.create({
      customer: customerId,
      worker: workerId,
      profession: worker.profession,
      description,
      location,
      scheduledDate,
      budget,
      status: "pending",
      });
    } catch (err) {
      // Unique index on active (customer, worker) pairs catches two simultaneous requests
      if (err.code === 11000) return res.status(409).json({ message: "You already have an active booking with this worker" });
      throw err;
    }

    res.status(201).json({ message: "Booking request sent to worker", booking });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET MY BOOKINGS (?status=pending optional)
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filter = { $or: [{ customer: userId }, { worker: userId }] };
    if (["pending", "accepted", "rejected", "completed", "cancelled"].includes(req.query.status)) filter.status = req.query.status;

    const bookings = await Booking.find(filter)
      .populate("customer", "name phone")
      .populate("worker", "name phone profession location rating profileImage availability")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: bookings.length, bookings: bookings.map((b) => withPrivatePhones(b, userId)) });
  } catch (error) {
    return handleError(res, error);
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

    if (booking.customer?._id?.toString() !== userId && booking.worker?._id?.toString() !== userId) {
      return res.status(403).json({ message: "You are not allowed to view this booking" });
    }

    res.status(200).json({ booking: withPrivatePhones(booking, userId) });
  } catch (error) {
    return handleError(res, error);
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

    const existing = await Booking.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Booking not found" });
    const booking = existing;

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

    // Atomic: only applies if the booking is still in the status we validated against
    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, status: booking.status },
      { status },
      { returnDocument: "after" }
    );
    if (!updated) return res.status(409).json({ message: "This booking was just updated. Please refresh." });

    res.status(200).json({ message: `Booking ${status}`, booking: updated });
  } catch (error) {
    return handleError(res, error);
  }
};
