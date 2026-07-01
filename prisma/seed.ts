import { PrismaClient, SeatClass } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Menyiapkan akun default multi-role...");
  const defaultPassword = await bcrypt.hash("user123", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);
  const managerPassword = await bcrypt.hash("manager123", 10);
  const staffPassword = await bcrypt.hash("staff123", 10);

  await prisma.user.upsert({
    where: { email: "user@gmail.com" },
    update: { name: "User Demo", password: defaultPassword, role: "USER", isVerified: true },
    create: { name: "User Demo", email: "user@gmail.com", password: defaultPassword, role: "USER", isVerified: true },
  });

  await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: { name: "Admin Renggo", password: adminPassword, role: "ADMIN", isVerified: true },
    create: { name: "Admin Renggo", email: "admin@gmail.com", password: adminPassword, role: "ADMIN", isVerified: true },
  });

  await prisma.user.upsert({
    where: { email: "manager@gmail.com" },
    update: { name: "Manager Renggo", password: managerPassword, role: "MANAGER", isVerified: true },
    create: { name: "Manager Renggo", email: "manager@gmail.com", password: managerPassword, role: "MANAGER", isVerified: true },
  });

  await prisma.user.upsert({
    where: { email: "staff@gmail.com" },
    update: { name: "Staff Operasional", password: staffPassword, role: "STAFF", isVerified: true },
    create: { name: "Staff Operasional", email: "staff@gmail.com", password: staffPassword, role: "STAFF", isVerified: true },
  });

  console.log("🧼 Menghapus data lama secara berurutan...");
  await prisma.flightSeat.deleteMany({});
  await prisma.flight.deleteMany({});
  await prisma.plane.deleteMany({});
  await prisma.airline.deleteMany({});
  await prisma.airport.deleteMany({});

  console.log("✈️ Seeding data bandara...");
  const cgk = await prisma.airport.create({
    data: { code: "CGK", name: "Soekarno-Hatta International Airport", city: "Jakarta", country: "Indonesia" },
  });
  const dps = await prisma.airport.create({
    data: { code: "DPS", name: "Ngurah Rai International Airport", city: "Bali", country: "Indonesia" },
  });
  await prisma.airport.create({
    data: { code: "SUB", name: "Juanda International Airport", city: "Surabaya", country: "Indonesia" },
  });
  await prisma.airport.create({
    data: { code: "KNO", name: "Kualanamu International Airport", city: "Medan", country: "Indonesia" },
  });

  console.log("🏢 Seeding data maskapai...");
  const renggoAir = await prisma.airline.create({
    data: { name: "Renggo Premium Air", code: "RG", logoUrl: "/logos/renggo.png" },
  });

  console.log("🛩️ Seeding data pesawat...");
  const plane = await prisma.plane.create({
    data: { name: "Boeing 737-800 NextGen", code: "PK-RGA", airlineId: renggoAir.id },
  });

  console.log("📅 Menyiapkan tanggal penerbangan otomatis (29 Juni - 10 Juli)...");
  // 🎯 PERUBAHAN DI SINI: Generate tanggal otomatis dari 2026-06-29 sampai 2026-07-10
  const targetDates: string[] = [];
  const startDate = new Date("2026-06-29");
  const endDate = new Date("2026-07-10");

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    targetDates.push(d.toISOString().split("T")[0]);
  }

  console.log("🚀 Menghasilkan jadwal penerbangan & kursi otomatis...");

  for (const dateStr of targetDates) {
    // 1. BALI (DPS) -> JAKARTA (CGK)
    const flightToJakarta = await prisma.flight.create({
      data: {
        flightNumber: `RG-${100 + Math.floor(Math.random() * 400)}`,
        planeId: plane.id,
        departureAirportId: dps.id,
        arrivalAirportId: cgk.id,
        departureTime: new Date(`${dateStr}T08:30:00.000Z`),
        arrivalTime: new Date(`${dateStr}T10:15:00.000Z`),
        priceEconomy: 1250000,
        priceBusiness: 2500000,
        priceFirstClass: 5000000,
      },
    });

    // 2. JAKARTA (CGK) -> BALI (DPS)
    const flightToBali = await prisma.flight.create({
      data: {
        flightNumber: `RG-${500 + Math.floor(Math.random() * 400)}`,
        planeId: plane.id,
        departureAirportId: cgk.id,
        arrivalAirportId: dps.id,
        departureTime: new Date(`${dateStr}T15:00:00.000Z`),
        arrivalTime: new Date(`${dateStr}T17:45:00.000Z`),
        priceEconomy: 1350000,
        priceBusiness: 2700000,
        priceFirstClass: 5400000,
      },
    });

    // Ambil semua jenis kelas untuk diisi ke kursi maskapai
    const classes = [SeatClass.ECONOMY, SeatClass.BUSINESS];
    for (const sClass of classes) {
      await prisma.flightSeat.createMany({
        data: Array.from({ length: 5 }).map((_, index) => ({
          flightId: flightToJakarta.id,
          seatNumber: `${index + 1}${sClass === SeatClass.ECONOMY ? 'A' : 'K'}`,
          seatClass: sClass,
          isAvailable: true,
        }))
      });

      await prisma.flightSeat.createMany({
        data: Array.from({ length: 5 }).map((_, index) => ({
          flightId: flightToBali.id,
          seatNumber: `${index + 1}${sClass === SeatClass.ECONOMY ? 'A' : 'K'}`,
          seatClass: sClass,
          isAvailable: true,
        }))
      });
    }
  }

  console.log("✨ Seeding Berhasil Dimuat 100%!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });