import express from "express";
import cors from "cors";
import { config } from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import workerRoutes from "./routes/workerRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

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

// Catch-all error handler (e.g. multer errors, bad JSON)
app.use((err, req, res, next) => {
  res.status(err.status || 400).json({ message: err.message || "Something went wrong" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});
