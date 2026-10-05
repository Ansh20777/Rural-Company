import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        "Please enter a valid email address",
      ],
    },
    // Stored as a bcrypt hash; the 6-character minimum is enforced in the controller before hashing
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    age: { type: Number, min: 18, max: 100 },
    role: {
      type: String,
      enum: ["worker", "customer"],
      default: "customer",
      required: true,
    },
    phone: { type: String, trim: true },
    address: { type: String, trim: true, maxlength: 300 },
    pinCode: { type: String, trim: true, match: [/^\d{6}$/, "PIN code must contain 6 digits"] },
    location: {
      village: { type: String, trim: true },
      district: { type: String, trim: true },
      state: { type: String, trim: true },
    },

    // ---------- Worker-specific fields ----------
    profession: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    experience: { type: Number, min: [0, "Experience cannot be negative"] },
    bio: { type: String, trim: true, maxlength: 500 },
    expectedRate: { type: Number, min: 0 },
    rateUnit: { type: String, enum: ["hour", "day", "month"], default: "day" },
    workTypes: [
      { type: String, enum: ["hourly", "contract", "part-time", "full-time"] },
    ],
    availability: { type: Boolean, default: true },

    // ---------- General ----------
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    profileImage: { type: String, default: "" },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, "location.district": 1, profession: 1 });

const User = mongoose.model("User", userSchema);
export default User;
