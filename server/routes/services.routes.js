// server/routes/services.routes.js
const express = require("express");
const prisma = require("../prisma");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();

// Public list (booking page)
router.get("/", async (req, res) => {
  const list = await prisma.service.findMany({ orderBy: { createdAt: "asc" } });
  res.json(list);
});

// Admin list
router.get("/admin", authRequired, requireRole("admin"), async (req, res) => {
  const list = await prisma.service.findMany({ orderBy: { createdAt: "asc" } });
  res.json(list);
});

// Admin create
router.post("/admin", authRequired, requireRole("admin"), async (req, res) => {
  const { name, pricePence, durationMins } = req.body || {};
  if (!name) return res.status(400).json({ message: "Name required" });

  const created = await prisma.service.create({
    data: {
      name: String(name).trim(),
      pricePence: Number(pricePence || 0),
      durationMins: Number(durationMins || 30),
    },
  });
  res.json(created);
});

// Admin update
router.patch("/admin/:id", authRequired, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  const patch = req.body || {};
  const updated = await prisma.service.update({
    where: { id },
    data: {
      name: patch.name !== undefined ? String(patch.name).trim() : undefined,
      pricePence: patch.pricePence !== undefined ? Number(patch.pricePence) : undefined,
      durationMins: patch.durationMins !== undefined ? Number(patch.durationMins) : undefined,
    },
  });
  res.json(updated);
});

// Admin delete
router.delete("/admin/:id", authRequired, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  await prisma.service.delete({ where: { id } });
  res.json({ ok: true });
});

module.exports = router;
