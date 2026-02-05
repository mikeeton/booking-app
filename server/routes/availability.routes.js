// server/routes/availability.routes.js
const express = require("express");
const prisma = require("../prisma");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();

// Public (booking page uses it)
router.get("/", async (req, res) => {
  const row = await prisma.availabilityConfig.findUnique({ where: { id: 1 } });
  res.json(row || { id: 1, slotStepMins: 15, byDay: [] });
});

// Admin save
router.put("/admin", authRequired, requireRole("admin"), async (req, res) => {
  const { slotStepMins, byDay } = req.body || {};
  const updated = await prisma.availabilityConfig.upsert({
    where: { id: 1 },
    update: {
      slotStepMins: Number(slotStepMins || 15),
      byDay: byDay ?? [],
    },
    create: {
      id: 1,
      slotStepMins: Number(slotStepMins || 15),
      byDay: byDay ?? [],
    },
  });
  res.json(updated);
});

module.exports = router;
