// server/seed.js
const bcrypt = require("bcrypt");
const prisma = require("./prisma");

async function main() {
  const adminPass = await bcrypt.hash("admin123", 10);
  const customerPass = await bcrypt.hash("customer123", 10);

  await prisma.adminUser.upsert({
    where: { email: "admin@booking.com" },
    update: { password: adminPass, name: "Admin" },
    create: { email: "admin@booking.com", password: adminPass, name: "Admin" },
  });

  await prisma.customer.upsert({
    where: { email: "demo@customer.com" },
    update: { password: customerPass, name: "Jason Make" },
    create: {
      email: "demo@customer.com",
      password: customerPass,
      name: "Jason Make",
      phone: "",
    },
  });

  // Services
  await prisma.service.upsert({
    where: { id: "consultation" },
    update: {},
    create: { id: "consultation", name: "Consultation", pricePence: 2500, durationMins: 30 },
  });

  await prisma.service.upsert({
    where: { id: "haircut" },
    update: {},
    create: { id: "haircut", name: "Haircut", pricePence: 3000, durationMins: 45 },
  });

  // Availability singleton row
  await prisma.availabilityConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      slotStepMins: 15,
      byDay: [
        { enabled: false, start: "09:00", end: "17:00", breaks: [] }, // Sun 0
        { enabled: true, start: "09:00", end: "17:00", breaks: [{ start: "12:30", end: "13:00" }] },
        { enabled: true, start: "09:00", end: "17:00", breaks: [{ start: "12:30", end: "13:00" }] },
        { enabled: true, start: "09:00", end: "17:00", breaks: [{ start: "12:30", end: "13:00" }] },
        { enabled: true, start: "09:00", end: "17:00", breaks: [{ start: "12:30", end: "13:00" }] },
        { enabled: true, start: "09:00", end: "17:00", breaks: [{ start: "12:30", end: "13:00" }] },
        { enabled: false, start: "09:00", end: "17:00", breaks: [] }, // Sat
      ],
    },
  });

  // Business settings singleton row
  await prisma.businessSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      businessName: "Booking Admin",
      contactEmail: "hello@booking.com",
      phone: "",
      address: "",
    },
  });
}

main()
  .then(() => console.log("✅ Seed complete"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  