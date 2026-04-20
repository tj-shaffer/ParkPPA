import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding ParkPGH database...\n");

  // ─── Clear existing data ──────────────────────────────────────────────────
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.autoPay.deleteMany();
  await prisma.magicLink.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.user.deleteMany();
  await prisma.garage.deleteMany();
  console.log("  ✓ Cleared existing data");

  // ─── Garages (Real PPA facilities) ────────────────────────────────────────
  const garages = await Promise.all([
    prisma.garage.create({
      data: {
        name: "Smithfield-Liberty Garage",
        address: "111 9th St, Pittsburgh, PA 15222",
        neighborhood: "Downtown",
        totalSpaces: 596,
        leasedSpaces: 541,
        monthlyRate: 225.00,
        residentMonthlyRate: 175.00,
        daytimeRate: 185.00,
        nightRate: 100.00,
        phone: "(412) 255-7278",
        status: "ACTIVE",
        operatingHours: "24 Hours",
      },
    }),
    prisma.garage.create({
      data: {
        name: "Third Avenue Garage",
        address: "144 Third Ave, Pittsburgh, PA 15222",
        neighborhood: "Downtown",
        totalSpaces: 835,
        leasedSpaces: 712,
        monthlyRate: 225.00,
        residentMonthlyRate: 175.00,
        daytimeRate: 185.00,
        nightRate: 100.00,
        phone: "(412) 456-1400",
        status: "ACTIVE",
        operatingHours: "24 Hours",
      },
    }),
    prisma.garage.create({
      data: {
        name: "Mellon Square Garage",
        address: "525 William Penn Way, Pittsburgh, PA 15219",
        neighborhood: "Downtown",
        totalSpaces: 895,
        leasedSpaces: 680,
        monthlyRate: 240.00,
        residentMonthlyRate: 190.00,
        daytimeRate: 190.00,
        nightRate: 110.00,
        phone: "(412) 281-3698",
        status: "ACTIVE",
        operatingHours: "24 Hours",
      },
    }),
    prisma.garage.create({
      data: {
        name: "Forbes Semple Garage",
        address: "Forbes Ave & Semple St, Pittsburgh, PA 15213",
        neighborhood: "Oakland",
        totalSpaces: 625,
        leasedSpaces: 590,
        monthlyRate: 200.00,
        residentMonthlyRate: 160.00,
        daytimeRate: 175.00,
        nightRate: 90.00,
        phone: "(412) 682-6100",
        status: "ACTIVE",
        operatingHours: "24 Hours",
      },
    }),
    prisma.garage.create({
      data: {
        name: "First Avenue Garage",
        address: "100 First Ave, Pittsburgh, PA 15222",
        neighborhood: "Downtown",
        totalSpaces: 978,
        leasedSpaces: 801,
        monthlyRate: 230.00,
        residentMonthlyRate: 180.00,
        daytimeRate: 190.00,
        nightRate: 100.00,
        phone: "(412) 393-0710",
        status: "ACTIVE",
        operatingHours: "24 Hours",
      },
    }),
    prisma.garage.create({
      data: {
        name: "Oliver Garage",
        address: "130 S 10th St, Pittsburgh, PA 15203",
        neighborhood: "South Side",
        totalSpaces: 408,
        leasedSpaces: 315,
        monthlyRate: 175.00,
        residentMonthlyRate: 135.00,
        daytimeRate: 155.00,
        nightRate: 85.00,
        phone: "(412) 681-2770",
        status: "ACTIVE",
        operatingHours: "24 Hours",
      },
    }),
    prisma.garage.create({
      data: {
        name: "Grant Street Transportation Center",
        address: "310 Grant St, Pittsburgh, PA 15219",
        neighborhood: "Downtown",
        totalSpaces: 520,
        leasedSpaces: 475,
        monthlyRate: 235.00,
        residentMonthlyRate: 185.00,
        daytimeRate: 195.00,
        nightRate: 105.00,
        phone: "(412) 560-7275",
        status: "ACTIVE",
        operatingHours: "24 Hours",
      },
    }),
    prisma.garage.create({
      data: {
        name: "Second Avenue Garage",
        address: "Second Ave, Pittsburgh, PA 15222",
        neighborhood: "Downtown",
        totalSpaces: 740,
        leasedSpaces: 582,
        monthlyRate: 215.00,
        residentMonthlyRate: 170.00,
        daytimeRate: 180.00,
        nightRate: 95.00,
        phone: "(412) 560-7275",
        status: "ACTIVE",
        operatingHours: "24 Hours",
      },
    }),
    prisma.garage.create({
      data: {
        name: "Wood-Allies Garage",
        address: "516 Wood St, Pittsburgh, PA 15222",
        neighborhood: "Downtown",
        totalSpaces: 330,
        leasedSpaces: 290,
        monthlyRate: 220.00,
        residentMonthlyRate: 175.00,
        daytimeRate: 185.00,
        nightRate: 95.00,
        phone: "(412) 560-7275",
        status: "ACTIVE",
        operatingHours: "24 Hours",
      },
    }),
    prisma.garage.create({
      data: {
        name: "Ninth & Penn Garage",
        address: "9th St & Penn Ave, Pittsburgh, PA 15222",
        neighborhood: "Cultural District",
        totalSpaces: 550,
        leasedSpaces: 410,
        monthlyRate: 210.00,
        residentMonthlyRate: 165.00,
        daytimeRate: 175.00,
        nightRate: 90.00,
        phone: "(412) 560-7275",
        status: "ACTIVE",
        operatingHours: "24 Hours",
      },
    }),
    prisma.garage.create({
      data: {
        name: "Stanwix Street Garage",
        address: "Stanwix St, Pittsburgh, PA 15222",
        neighborhood: "Downtown",
        totalSpaces: 480,
        leasedSpaces: 350,
        monthlyRate: 210.00,
        residentMonthlyRate: 165.00,
        daytimeRate: 175.00,
        nightRate: 90.00,
        phone: "(412) 560-7275",
        status: "MAINTENANCE",
        operatingHours: "Closed for renovations",
      },
    }),
  ]);
  console.log(`  ✓ Created ${garages.length} garages`);

  // ─── Users ────────────────────────────────────────────────────────────────
  const consumer = await prisma.user.create({
    data: {
      email: "tony@example.com",
      phone: "+12399192667",
      firstName: "Tony",
      lastName: "S.",
      role: "CONSUMER",
      notifyPreference: "BOTH",
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@parkpgh.app",
      phone: "+14125607275",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      notifyPreference: "EMAIL",
    },
  });
  console.log("  ✓ Created 2 users (consumer + admin)");

  // ─── Lease for Tony ───────────────────────────────────────────────────────
  const smithfield = garages[0]; // Smithfield-Liberty

  const lease = await prisma.lease.create({
    data: {
      leaseNumber: "PGH-2026-0042",
      garageId: smithfield.id,
      userId: consumer.id,
      spotNumber: "B-247",
      type: "TWENTY_FOUR_HR",
      monthlyRate: 175.00,
      isResident: true,
      residentProofStatus: "VERIFIED",
      startDate: new Date("2025-10-31"),
      autoRenew: true,
      status: "ACTIVE",
    },
  });
  console.log("  ✓ Created lease PGH-2026-0042");

  // ─── Auto-Pay ─────────────────────────────────────────────────────────────
  await prisma.autoPay.create({
    data: {
      leaseId: lease.id,
      cardLast4: "4242",
      cardBrand: "Visa",
      enabled: true,
    },
  });
  console.log("  ✓ Created auto-pay enrollment");

  // ─── Payments (6 months of history) ───────────────────────────────────────
  const payments = [
    { dueDate: "2025-12-01", paidAt: "2025-11-27", status: "PAID" as const },
    { dueDate: "2026-01-01", paidAt: null, status: "PAST_DUE" as const },
    { dueDate: "2026-02-01", paidAt: null, status: "PAST_DUE" as const },
    { dueDate: "2026-03-01", paidAt: "2026-02-28", status: "PAID" as const },
    { dueDate: "2026-04-01", paidAt: "2026-03-29", status: "PAID" as const },
    { dueDate: "2026-05-01", paidAt: null, status: "PENDING" as const },
  ];

  for (const p of payments) {
    await prisma.payment.create({
      data: {
        leaseId: lease.id,
        amount: 175.00,
        dueDate: new Date(p.dueDate),
        paidAt: p.paidAt ? new Date(p.paidAt) : null,
        status: p.status,
        processor: p.status === "PAID" ? "STRIPE" : "MANUAL",
      },
    });
  }
  console.log(`  ✓ Created ${payments.length} payment records`);

  // ─── Welcome Notification ─────────────────────────────────────────────────
  await prisma.notification.create({
    data: {
      userId: consumer.id,
      leaseId: lease.id,
      type: "WELCOME",
      channel: "EMAIL",
      content: "Welcome to ParkPGH! Your lease at Smithfield-Liberty Garage is now active.",
      status: "SENT",
      sentAt: new Date("2025-11-01"),
    },
  });
  console.log("  ✓ Created welcome notification");

  console.log("\n✅ Seed complete! Database is ready.\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
