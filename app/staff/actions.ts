"use server";

import prisma from "@/lib/prisma";
import { cancelBookingAndReleaseSeats, confirmPaidBooking } from "@/lib/bookingLifecycle";
import { requireRole } from "@/lib/auth";
import { BookingStatus, PaymentStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function confirmBookingAction(formData: FormData) {
  await requireRole([Role.STAFF]);

  const bookingId = Number(formData.get("bookingId"));

  if (!bookingId) {
    throw new Error("BOOKING_ID_REQUIRED");
  }

  // 1. Ambil data booking terlebih dahulu untuk mengetahui flightId-nya sebelum statusnya diubah
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { flightId: true },
  });

  await prisma.$transaction(async (tx) => {
    await confirmPaidBooking(tx, bookingId);
  });

  revalidatePath("/staff");
  revalidatePath("/dashboard/bookings");

  // 2. Jika booking ditemukan, langsung paksa browser pindah ke manifest flightId tersebut
  if (booking?.flightId) {
    redirect(`/staff?flightId=${booking.flightId}`);
  }
}

export async function confirmBoardingAction(formData: FormData) {
  await requireRole([Role.STAFF]);

  const bookingCode = formData.get("bookingCode") as string;
  if (!bookingCode || !bookingCode.trim()) {
    throw new Error("BOOKING_CODE_REQUIRED");
  }

  // Cari booking berdasarkan bookingCode
  const booking = await prisma.booking.findUnique({
    where: { bookingCode: bookingCode.trim().toUpperCase() },
    select: { id: true, flightId: true, status: true, isBoarded: true },
  });

  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND: Kode booking tidak ditemukan.");
  }

  if (booking.isBoarded) {
    throw new Error("ALREADY_BOARDED: Penumpang sudah boarding.");
  }

  if (booking.status !== BookingStatus.CONFIRMED) {
    throw new Error("NOT_CONFIRMED: Booking belum dikonfirmasi staff.");
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { isBoarded: true },
  });

  revalidatePath("/staff");
  revalidatePath("/dashboard/bookings");

  redirect(`/staff?flightId=${booking.flightId}`);
}

export async function cancelBookingAction(formData: FormData) {
  await requireRole([Role.STAFF]);

  const bookingId = Number(formData.get("bookingId"));

  if (!bookingId) {
    throw new Error("BOOKING_ID_REQUIRED");
  }

  await prisma.$transaction(async (tx) => {
    await cancelBookingAndReleaseSeats(tx, bookingId, BookingStatus.CANCELLED, PaymentStatus.REFUNDED);
  });

  revalidatePath("/staff");
  revalidatePath("/dashboard/bookings");
}