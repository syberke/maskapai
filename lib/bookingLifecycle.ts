import { BookingStatus, PaymentStatus, Prisma } from "@prisma/client";

type BookingTx = Prisma.TransactionClient;

export async function releaseBookingSeats(tx: BookingTx, bookingId: number) {
  const seats = await tx.bookingSeat.findMany({
    where: { bookingId },
    select: { flightSeatId: true },
  });

  const seatIds = seats.map((seat) => seat.flightSeatId);

  if (seatIds.length === 0) {
    return;
  }

  await tx.flightSeat.updateMany({
    where: { id: { in: seatIds } },
    data: { isAvailable: true },
  });
}

export async function cancelBookingAndReleaseSeats(
  tx: BookingTx,
  bookingId: number,
  status: Extract<BookingStatus, "CANCELLED" | "EXPIRED"> = "CANCELLED",
  paymentStatus: Extract<PaymentStatus, "FAILED" | "REFUNDED"> = "FAILED",
) {
  await releaseBookingSeats(tx, bookingId);

  return tx.booking.update({
    where: { id: bookingId },
    data: {
      status,
      payment: {
        update: {
          paymentStatus,
        },
      },
    },
  });
}

export async function deleteBookingAndReleaseSeats(tx: BookingTx, bookingId: number) {
  await releaseBookingSeats(tx, bookingId);

  return tx.booking.delete({
    where: { id: bookingId },
  });
}

export async function markPaymentPaidKeepBookingPending(tx: BookingTx, bookingId: number) {
  return tx.booking.update({
    where: { id: bookingId },
    data: {
      payment: {
        update: {
          paymentStatus: PaymentStatus.PAID,
        },
      },
    },
    include: {
      payment: true,
    },
  });
}

export async function confirmPaidBooking(tx: BookingTx, bookingId: number) {
  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });

  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  if (booking.payment?.paymentStatus !== PaymentStatus.PAID) {
    throw new Error("PAYMENT_NOT_PAID");
  }

  if (booking.status !== BookingStatus.PENDING) {
    throw new Error("BOOKING_NOT_PENDING");
  }

  return tx.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CONFIRMED },
  });
}
