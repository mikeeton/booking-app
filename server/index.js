// server/index.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("./prisma");


const authRoutes = require("./routes/auth.routes");
const servicesRoutes = require("./routes/services.routes");
const availabilityRoutes = require("./routes/availability.routes");
const appointmentsRoutes = require("./routes/appointments.routes");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/", (req, res) => res.json({ message: "Booking API", health: "ok", version: "1.0.0" }));
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/appointments", appointmentsRoutes);

const PORT = process.env.PORT || 3001;




// -------------------- helpers --------------------
function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET in .env");
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { sub, role, email, name }
    next();
  } catch {
    return res.status(401).json({ error: "Invalid/expired token" });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== role) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

function normEmail(email) {
  return String(email || "").trim().toLowerCase();
}

// -------------------- health check --------------------
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// =====================================================
// AUTH: ADMIN
// =====================================================
app.post("/api/auth/admin/login", async (req, res) => {
  const email = normEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!email.includes("@")) return res.status(400).json({ error: "Invalid email" });
  if (!password) return res.status(400).json({ error: "Password required" });

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, admin.password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({
    sub: admin.id,
    role: "admin",
    email: admin.email,
    name: admin.name || "Admin",
  });

  res.json({
    token,
    admin: { id: admin.id, email: admin.email, name: admin.name || "Admin" },
  });
});

// =====================================================
// AUTH: CUSTOMER
// =====================================================
app.post("/api/auth/customer/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = normEmail(req.body.email);
  const phone = String(req.body.phone || "").trim();
  const password = String(req.body.password || "");

  if (!name) return res.status(400).json({ error: "Name is required" });
  if (!email.includes("@")) return res.status(400).json({ error: "Invalid email" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 chars" });

  const exists = await prisma.customer.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: "Email already in use" });

  const hash = await bcrypt.hash(password, 10);

  const customer = await prisma.customer.create({
    data: { name, email, phone, password: hash },
    select: { id: true, name: true, email: true, phone: true },
  });

  const token = signToken({
    sub: customer.id,
    role: "customer",
    email: customer.email,
    name: customer.name,
  });

  res.json({ token, customer });
});

app.post("/api/auth/customer/login", async (req, res) => {
  const email = normEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!email.includes("@")) return res.status(400).json({ error: "Invalid email" });
  if (!password) return res.status(400).json({ error: "Password required" });

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, customer.password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({
    sub: customer.id,
    role: "customer",
    email: customer.email,
    name: customer.name,
  });

  res.json({
    token,
    customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone || "" },
  });
});

// Customer "me"
app.get("/api/customer/me", requireAuth, requireRole("customer"), async (req, res) => {
  const id = req.user.sub;

  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true },
  });

  res.json({ customer });
});

// =====================================================
// SERVICES (public read for booking)
// =====================================================
app.get("/api/services", async (req, res) => {
  const services = await prisma.service.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, pricePence: true, durationMins: true },
  });

  // Map to your frontend shape
  res.json({
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      price: s.pricePence / 100,
      durationMins: s.durationMins,
    })),
  });
});

// =====================================================
// APPOINTMENTS
// - Customer: my bookings
// - Admin: all bookings
// - Create: customer only (prevents random people booking without login)
// =====================================================

// Customer: My bookings
app.get("/api/appointments/my", requireAuth, requireRole("customer"), async (req, res) => {
  const customerId = req.user.sub;

  const appts = await prisma.appointment.findMany({
    where: { customerId },
    orderBy: { startISO: "desc" },
    include: { service: true },
  });

  res.json({
    appointments: appts.map((a) => ({
      id: a.id,
      customerId: a.customerId,
      serviceId: a.serviceId,
      startISO: a.startISO.toISOString(),
      endISO: a.endISO.toISOString(),
      status: a.status,
      note: a.note,
      createdAt: a.createdAt.toISOString(),
      service: {
        id: a.service.id,
        name: a.service.name,
        price: a.service.pricePence / 100,
        durationMins: a.service.durationMins,
      },
    })),
  });
});

// Admin: all bookings
app.get("/api/admin/appointments", requireAuth, requireRole("admin"), async (req, res) => {
  const appts = await prisma.appointment.findMany({
    orderBy: { startISO: "desc" },
    include: { service: true, customer: true },
  });

  res.json({
    appointments: appts.map((a) => ({
      id: a.id,
      customerId: a.customerId,
      serviceId: a.serviceId,
      startISO: a.startISO.toISOString(),
      endISO: a.endISO.toISOString(),
      status: a.status,
      note: a.note,
      createdAt: a.createdAt.toISOString(),
      customer: { id: a.customer.id, name: a.customer.name, email: a.customer.email },
      service: { id: a.service.id, name: a.service.name, price: a.service.pricePence / 100, durationMins: a.service.durationMins },
    })),
  });
});

// Create booking (customer only) + hard double-booking protection
app.post("/api/appointments", requireAuth, requireRole("customer"), async (req, res) => {
  const customerId = req.user.sub;
  const { serviceId, startISO } = req.body;

  if (!serviceId) return res.status(400).json({ error: "serviceId required" });
  if (!startISO) return res.status(400).json({ error: "startISO required" });

  const service = await prisma.service.findUnique({ where: { id: String(serviceId) } });
  if (!service) return res.status(404).json({ error: "Service not found" });

  const start = new Date(startISO);
  if (Number.isNaN(start.getTime())) return res.status(400).json({ error: "Invalid startISO" });

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + Number(service.durationMins || 30));

  try {
    const created = await prisma.appointment.create({
      data: {
        customerId,
        serviceId: service.id,
        startISO: start,
        endISO: end,
        status: "confirmed",
        note: "",
      },
    });

    res.json({
      appointment: {
        id: created.id,
        customerId,
        serviceId: service.id,
        startISO: created.startISO.toISOString(),
        endISO: created.endISO.toISOString(),
        status: created.status,
      },
    });
  } catch (e) {
    // Prisma unique constraint (double-booking)
    if (e?.code === "P2002") {
      return res.status(409).json({ error: "That slot has already been booked. Please pick another time." });
    }
    console.error(e);
    return res.status(500).json({ error: "Could not create booking" });
  }
});

// -------------------- start --------------------
const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
