const buckets = new Map();

// Keep the in-memory MVP limiter bounded even when many distinct IPs hit the API.
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}, 60_000);
cleanupTimer.unref?.();

export const authRateLimit = ({ windowMs = 15 * 60_000, max = 30, message = "Too many attempts. Please try again later." } = {}) => (req, res, next) => {
  const now = Date.now();
  const key = `${req.ip || req.socket.remoteAddress || "unknown"}:${req.path}`;
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  res.setHeader("RateLimit-Limit", max);
  res.setHeader("RateLimit-Remaining", Math.max(0, max - bucket.count));
  res.setHeader("RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));
  if (bucket.count > max) {
    res.setHeader("Retry-After", Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)));
    return res.status(429).json({ message });
  }
  next();
};
