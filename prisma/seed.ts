import { PrismaClient, SeatClass } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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
  const sub = await prisma.airport.create({
    data: { code: "SUB", name: "Juanda International Airport", city: "Surabaya", country: "Indonesia" },
  });
  const kno = await prisma.airport.create({
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

  console.log("📅 Menyiapkan tanggal penerbangan...");
  const targetDates = ["2026-06-29", "2026-06-30", "2026-07-01"];

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
        // 🎯 FIX: Ditambahkan harga yang kurang di sini agar tidak error
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