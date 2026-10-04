// Usage: router.post("/", authMiddleware, requireRole("customer"), handler)
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Only ${roles.join(" or ")} can do this`
    });
  }
  next();
};

export default requireRole;
