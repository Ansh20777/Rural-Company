import express from "express";
import cors from "cors";
import { config } from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/userModel.js";
import Booking from "./models/bookingModel.js";
import Job from "./models/jobModel.js";
import Application from "./models/applicationModel.js";
import Review from "./models/reviewModel.js";
import authRoutes from "./routes/authRoutes.js";
import workerRoutes from "./routes/workerRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

config();

const app = express();

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not defined in .env - refusing to start");
  process.exit(1);
}

app.disable("x-powered-by");

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true }));
app.use(express.json({ limit: "8mb" }));

// API routes
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/user", authRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/booking", bookingRoutes);       // quick jobs
app.use("/api/jobs", jobRoutes);              // long jobs (post + apply)
app.use("/api/applications", applicationRoutes);
app.use("/api/reviews", reviewRoutes);

// 404 for unknown routes
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Catch-all error handler (bad JSON, oversized body, multer errors, anything unexpected)
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.name === "MulterError") {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Image must be smaller than 5 MB" : err.message;
    return res.status(400).json({ message });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request is too large. Try a smaller image." });
  }
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 ? "Something went wrong" : err.message || "Bad request" });
});

const PORT = process.env.PORT || 5000;

// Start listening only after MongoDB is connected, so early requests never hit a half-ready server
connectDB().then(async () => {
  // Make sure unique indexes (duplicate bookings / reviews / applications / emails) exist BEFORE serving requests
  await Promise.all([User, Booking, Job, Application, Review].map((model) =>
    model.init().catch((error) => console.warn(`WARNING: could not build indexes for ${model.modelName}: ${error.message}. Duplicate-protection for this collection is NOT guaranteed (use MongoDB 6+).`))
  ));
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });
});
