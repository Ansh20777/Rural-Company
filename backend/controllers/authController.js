import { getPinCoords } from "../utils/geo.js";
import { handleError, isValidImageData } from "../utils/helpers.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const publicUser = (user) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  age: user.age,
  address: user.address,
  pinCode: user.pinCode,
  location: user.location,
  profession: user.profession,
  experience: user.experience,
  skills: user.skills,
  bio: user.bio,
  expectedRate: user.expectedRate,
  rateUnit: user.rateUnit,
  workTypes: user.workTypes,
  availability: user.availability,
  rating: user.rating,
  reviewCount: user.reviewCount,
  profileImage: user.profileImage,
});

// REGISTER
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, age, address, pinCode, location, profession, experience } = req.body || {};

    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string" || !name.trim() || !email.trim() || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required" });
    }
    if (!["worker", "customer"].includes(role)) {
      return res.status(400).json({ message: "Role must be worker or customer" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }
    if (password.length > 72) {
      return res.status(400).json({ message: "Password must be at most 72 characters long" });
    }
    if (role === "worker" && (typeof profession !== "string" || !profession.trim())) {
      return res.status(400).json({ message: "Profession is required for workers" });
    }
    if (phone !== undefined && phone !== "" && !/^[+()\d\s-]{7,20}$/.test(String(phone))) {
      return res.status(400).json({ message: "Please enter a valid phone number" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      phone,
      age,
      address,
      pinCode,
      location,
      profession: role === "worker" ? profession : undefined,
      experience: role === "worker" ? experience : undefined,
      availability: true,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: publicUser(user),
      // Without a known PIN code the account cannot appear in "within N km" searches
      ...(pinCode && !getPinCoords(pinCode)
        ? { warning: `We could not locate PIN code ${pinCode}, so you may not appear in distance searches. Please check it in your profile.` }
        : {}),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    return handleError(res, error);
  }
};

// UPDATE SHARED ACCOUNT PROFILE (customer or worker)
export const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.profileImage !== undefined && !isValidImageData(req.body.profileImage)) {
      return res.status(400).json({ message: "Profile image must be a PNG, JPG, WEBP or GIF under 5 MB" });
    }

    const fields = ["name", "age", "phone", "address", "pinCode", "location", "profileImage"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    await user.save();
    const data = user.toObject();
    delete data.password;
    res.status(200).json({ message: "Profile updated successfully", user: data });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    return handleError(res, error);
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET LOGGED-IN USER (frontend calls this on page refresh)
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user: { ...user.toObject(), id: user._id } });
  } catch (error) {
    return handleError(res, error);
  }
};
