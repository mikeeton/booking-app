// server/routes/appointments.routes.js
const express = require("express");
const prisma = require("../prisma");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();

function toDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

// Customer create appointment (HARD double-booking prevention)
router.post("/", authRequired, requireRole("customer"), async (req, res) => {
  const { serviceId, startISO, endISO, note } = req.body || {};
  if (!serviceId || !startISO || !endISO) return res.status(400).json({ message: "serviceId, startISO, endISO required" });

  const start = toDate(startISO);
  const end = toDate(endISO);
  if (!start || !end) return res.status(400).json({ message: "Invalid dates" });
  if (end <= start) return res.status(400).json({ message: "End must be after start" });

  try {
    const created = await prisma.$transaction(async (tx) => {
      // overlap check (hard protection)
      const conflict = await tx.appointment.findFirst({
        where: {
          startISO: { lt: end },
          endISO: { gt: start },
          status: { not: "cancelled" },
        },
      });

      if (conflict) {
        const err = new Error("That time overlaps an existing booking.");
        err.status = 409;
        throw err;
      }

      return tx.appointment.create({
        data: {
          customerId: req.user.sub,
          serviceId,
          startISO: start,
          endISO: end,
          note: note ? String(note) : "",
          status: "confirmed",
        },
        include: { service: true },
      });
    });

    return res.json(created);
  } catch (e) {
    return res.status(e.status || 500).json({ message: e.message || "Could not create appointment" });
  }
});

// Customer “my bookings”
router.get("/my", authRequired, requireRole("customer"), async (req, res) => {
  const list = await prisma.appointment.findMany({
    where: { customerId: req.user.sub },
    orderBy: { startISO: "desc" },
    include: { service: true },
  });
  res.json(list);
});

// Admin list appointments
router.get("/admin", authRequired, requireRole("admin"), async (req, res) => {
  const list = await prisma.appointment.findMany({
    orderBy: { startISO: "desc" },
    include: { customer: true, service: true },
  });
  res.json(list);
});

// Admin cancel/delete
router.delete("/admin/:id", authRequired, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  await prisma.appointment.delete({ where: { id } });
  res.json({ ok: true });
});

module.exports = router;

