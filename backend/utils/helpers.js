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
