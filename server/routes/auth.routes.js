// server/routes/auth.routes.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

function signToken({ id, email, role }) {
  return jwt.sign(
    { sub: id, email, role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Admin login
router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  const admin = await prisma.adminUser.findUnique({ where: { email: String(email).toLowerCase().trim() } });
  if (!admin) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(String(password), admin.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ id: admin.id, email: admin.email, role: "admin" });
  return res.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name || "Admin" } });
});

// Customer register
router.post("/customer/register", async (req, res) => {
  const { name, email, phone, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ message: "Name, email, password required" });
  if (String(password).length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

  const emailNorm = String(email).toLowerCase().trim();

  const existing = await prisma.customer.findUnique({ where: { email: emailNorm } });
  if (existing) return res.status(409).json({ message: "Email already registered" });

  const hash = await bcrypt.hash(String(password), 10);
  const customer = await prisma.customer.create({
    data: { name: String(name).trim(), email: emailNorm, phone: phone ? String(phone).trim() : "", password: hash },
  });

  const token = signToken({ id: customer.id, email: customer.email, role: "customer" });
  return res.json({ token, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone || "" } });
});

// Customer login
router.post("/customer/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  const emailNorm = String(email).toLowerCase().trim();
  const customer = await prisma.customer.findUnique({ where: { email: emailNorm } });
  if (!customer) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(String(password), customer.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ id: customer.id, email: customer.email, role: "customer" });
  return res.json({ token, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone || "" } });
});

// "Me" endpoint (works for both roles)
router.get("/me", authRequired, async (req, res) => {
  const { role, sub } = req.user;

  if (role === "admin") {
    const admin = await prisma.adminUser.findUnique({ where: { id: sub } });
    if (!admin) return res.status(404).json({ message: "Not found" });
    return res.json({ role, user: { id: admin.id, email: admin.email, name: admin.name || "Admin" } });
  }

  if (role === "customer") {
    const customer = await prisma.customer.findUnique({ where: { id: sub } });
    if (!customer) return res.status(404).json({ message: "Not found" });
    return res.json({ role, user: { id: customer.id, email: customer.email, name: customer.name, phone: customer.phone || "" } });
  }

  return res.status(400).json({ message: "Bad role" });
});

module.exports = router;
