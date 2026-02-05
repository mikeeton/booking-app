// server/middleware/auth.js
const jwt = require("jsonwebtoken");

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: "Missing token" });
  if (!process.env.JWT_SECRET) return res.status(500).json({ message: "Missing JWT_SECRET in env" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { sub, role, email, name, iat, exp }
    return next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token", detail: e.message });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Missing user" });
    if (req.user.role !== role) return res.status(403).json({ message: "Forbidden" });
    return next();
  };
}

module.exports = { authRequired, requireRole };
