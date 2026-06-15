"use server";

import { AttendanceStatus, BookingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function markAttendance(bookingId: string, batchId: string | null, status: AttendanceStatus) {
  await prisma.booking.update({ where: { id: bookingId }, data: { attendanceStatus: status } });
  if (batchId) {
    await prisma.attendance.upsert({
      where: { bookingId },
      create: { bookingId, batchId, status, markedAt: new Date() },
      update: { status, markedAt: new Date() }
    });
  }
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/dashboard");
}

export async function updateBookingNotes(formData: FormData) {
  await prisma.booking.update({
    where: { id: String(formData.get("bookingId")) },
    data: { notes: String(formData.get("notes") ?? "") }
  });
  revalidatePath("/admin/bookings");
}

export async function markPaymentReceived(bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payment: true } });
  if (!booking) return;
  await prisma.booking.update({ where: { id: bookingId }, data: { status: BookingStatus.PAID } });
  if (booking.payment) {
    await prisma.payment.update({ where: { id: booking.payment.id }, data: { status: BookingStatus.PAID, paidAt: new Date() } });
  } else {
    await prisma.payment.create({
      data: {
        bookingId,
        provider: "Manual",
        transactionId: `MANUAL-${booking.bookingReference}`,
        amount: booking.amount,
        currency: booking.currency,
        status: BookingStatus.PAID,
        paidAt: new Date()
      }
    });
  }
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/dashboard");
}

export async function updatePaymentStatus(bookingId: string, status: BookingStatus) {
  await prisma.booking.update({ where: { id: bookingId }, data: { status } });
  const payment = await prisma.payment.findUnique({ where: { bookingId } });
  if (payment) await prisma.payment.update({ where: { id: payment.id }, data: { status } });
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/dashboard");
}

export async function rescheduleBooking(formData: FormData) {
  const bookingId = String(formData.get("bookingId"));
  const batchId = String(formData.get("batchId"));
  const batch = await prisma.batch.findUnique({ where: { id: batchId }, include: { bookings: true } });
  if (!batch || batch.bookings.length >= batch.capacity) return;
  await prisma.booking.update({ where: { id: bookingId }, data: { batchId, programId: batch.programId, attendanceStatus: "NOT_MARKED" } });
  await prisma.attendance.deleteMany({ where: { bookingId } });
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/dashboard");
}
