import mongoose from "mongoose";

// Escape user input before using it inside a RegExp (prevents regex injection)
export const escapeRegex = (text = "") =>
  String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Reads ?page=1&limit=10 from the query string
export const getPagination = (query) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

export const isValidId = (id) => mongoose.isValidObjectId(id);

// Safe number parsing for query-string filters (returns undefined for junk like "abc")
export const toNumber = (value) => {
  if (value === undefined || value === null || String(value).trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

// Accept only real image data URLs of a sane size (profile images are stored inline for the MVP)
export const isValidImageData = (value) =>
  typeof value === "string" && (value === "" || (/^data:image\/(png|jpe?g|webp|gif);base64,/.test(value) && value.length <= 7 * 1024 * 1024));

// One place that turns thrown errors into correct HTTP responses:
// validation / cast -> 400, duplicate key -> 409, anything else -> 500 (details are logged, not leaked)
export const handleError = (res, error) => {
  if (error?.name === "ValidationError") {
    const first = Object.values(error.errors || {})[0];
    return res.status(400).json({ message: first?.message || error.message });
  }
  if (error?.name === "CastError") {
    return res.status(400).json({ message: `Invalid value for ${error.path}` });
  }
  if (error?.code === 11000) {
    return res.status(409).json({ message: "This record already exists" });
  }
  console.error(error);
  return res.status(500).json({ message: "Server error" });
};
