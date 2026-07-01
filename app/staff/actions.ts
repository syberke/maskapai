"use server";

import prisma from "@/lib/prisma";
import { cancelBookingAndReleaseSeats, confirmPaidBooking } from "@/lib/bookingLifecycle";
import { requireRole } from "@/lib/auth";
import { BookingStatus, PaymentStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation"; // 💡 Import redirect

export async function confirmBookingAction(formData: FormData) {
  await requireRole([Role.STAFF]);

  const bookingId = Number(formData.get("bookingId"));
  if (!bookingId) {
    throw new Error("BOOKING_ID_REQUIRED");
  }

  // 💡 1. Ambil data booking terlebih dahulu untuk mengetahui flightId-nya sebelum statusnya diubah
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { flightId: true },
  });

  await prisma.$transaction(async (tx) => {
    await confirmPaidBooking(tx, bookingId);
  });

  revalidatePath("/staff");
  revalidatePath("/dashboard/bookings");

  // 💡 2. Jika booking ditemukan, langsung paksa browser pindah ke manifest flightId tersebut
  if (booking?.flightId) {
    redirect(`/staff?flightId=${booking.flightId}`);
  }
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