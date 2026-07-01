import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

type PdfLine = {
  text: string;
  x: number;
  y: number;
  size?: number;
  font?: "regular" | "bold";
};

type PdfPage = PdfLine[];

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function sanitizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value: string) {
  return sanitizeText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function fitText(value: string, maxLength: number) {
  const clean = sanitizeText(value);
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, Math.max(0, maxLength - 3))}...`;
}

function renderLine(line: PdfLine) {
  const font = line.font === "bold" ? "F2" : "F1";
  return `BT /${font} ${line.size || 10} Tf ${line.x} ${line.y} Td (${escapePdfText(line.text)}) Tj ET`;
}

function createPdf(pages: PdfPage[]) {
  const objects: string[] = [];
  const addObject = (body: string) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = addObject("");
  const regularFontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldFontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageIds: number[] = [];

  pages.forEach((page) => {
    const stream = page.map(renderLine).join("\n");
    const contentId = addObject(`<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`);
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  });

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

export async function GET() {
  try {
    await requireRole([Role.MANAGER]);

    const paidPayments = await prisma.payment.findMany({
      where: { paymentStatus: "PAID" },
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          include: {
            user: true,
            bookingSeats: true,
            flight: {
              include: {
                departureAirport: true,
                arrivalAirport: true,
                plane: { include: { airline: true } },
              },
            },
          },
        },
      },
    });

    const totalRevenue = paidPayments.reduce((total, payment) => total + Number(payment.amount), 0);
    const totalTickets = paidPayments.reduce((total, payment) => total + payment.booking.bookingSeats.length, 0);
    const generatedAt = new Date().toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const pages: PdfPage[] = [[]];
    let currentPage = pages[0];
    let y = 790;

    const addLine = (line: Omit<PdfLine, "y">, lineHeight = 16) => {
      if (y < 60) {
        currentPage = [];
        pages.push(currentPage);
        y = 790;
      }
      currentPage.push({ ...line, y });
      y -= lineHeight;
    };

    addLine({ text: "RENGGO AIR", x: 48, size: 18, font: "bold" }, 22);
    addLine({ text: "Laporan Penjualan Tiket", x: 48, size: 14, font: "bold" }, 20);
    addLine({ text: `Dicetak pada: ${generatedAt}`, x: 48, size: 9 }, 30);
    addLine({ text: `Total Omset: ${formatCurrency(totalRevenue)}`, x: 48, size: 11, font: "bold" }, 18);
    addLine({ text: `Transaksi Sukses: ${paidPayments.length.toLocaleString("id-ID")}`, x: 48, size: 11, font: "bold" }, 18);
    addLine({ text: `Tiket Terjual: ${totalTickets.toLocaleString("id-ID")}`, x: 48, size: 11, font: "bold" }, 30);

    addLine({ text: "Invoice", x: 48, size: 8, font: "bold" }, 0);
    addLine({ text: "Penumpang", x: 176, size: 8, font: "bold" }, 0);
    addLine({ text: "Rute", x: 300, size: 8, font: "bold" }, 0);
    addLine({ text: "Tanggal", x: 380, size: 8, font: "bold" }, 0);
    addLine({ text: "Nominal", x: 462, size: 8, font: "bold" }, 18);

    if (paidPayments.length === 0) {
      addLine({ text: "Belum ada transaksi dengan status PAID.", x: 48, size: 10 }, 16);
    }

    paidPayments.forEach((payment) => {
      const booking = payment.booking;
      const route = `${booking.flight.departureAirport.code}-${booking.flight.arrivalAirport.code}`;
      const paidDate = payment.updatedAt.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      addLine({ text: fitText(payment.invoiceNumber, 22), x: 48, size: 8 }, 0);
      addLine({ text: fitText(booking.user.name, 20), x: 176, size: 8 }, 0);
      addLine({ text: route, x: 300, size: 8 }, 0);
      addLine({ text: paidDate, x: 380, size: 8 }, 0);
      addLine({ text: formatCurrency(Number(payment.amount)), x: 462, size: 8 }, 14);
      addLine({ text: `Booking ${booking.bookingCode} / ${booking.flight.plane.airline.name} / ${booking.flight.flightNumber}`, x: 48, size: 7 }, 16);
    });

    const pdf = createPdf(pages);
    const filename = `renggo-laporan-penjualan-${new Date().toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json({ message: "Gagal membuat PDF laporan penjualan." }, { status });
  }
}
