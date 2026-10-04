import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    profession: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    location: {
      village: String,
      district: String,
      state: String
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open"
    }
  },
  {
    timestamps: true
  }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;