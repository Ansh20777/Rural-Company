import jwt from "jsonwebtoken";

const sessionCookie = "rural_company_session";

const readCookie = (header, name) => {
  const entry = String(header || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
};

const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : readCookie(req.headers.cookie, sessionCookie);

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Extract token
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user information to request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

export default authMiddleware;
