"use server";

import { AttendanceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function slotKey(batchId: string, key: string) {
  return `orientation_slot_${batchId}_${key}`;
}

async function setConfig(key: string, value: string, group = "orientation") {
  await prisma.systemConfig.upsert({
    where: { key },
    create: { key, value, group },
    update: { value }
  });
}

export async function updateConfig(formData: FormData) {
  for (const [key, value] of formData.entries()) {
    await setConfig(String(key), String(value), String(key).startsWith("orientation") ? "orientation" : "website");
  }
  revalidatePath("/admin/orientation-settings");
  revalidatePath("/admin/environment-settings/server-config");
}

export async function updateOrientationPricing(formData: FormData) {
  const orientation = await prisma.program.findUnique({ where: { slug: "orientation" } });
  if (orientation) {
    await prisma.program.update({
      where: { id: orientation.id },
      data: {
        priceIndia: Number(formData.get("indiaPrice") ?? orientation.priceIndia),
        priceGlobal: Number(formData.get("internationalPrice") ?? orientation.priceGlobal),
        currencyIndia: String(formData.get("indiaCurrency") ?? "INR"),
        currencyGlobal: String(formData.get("internationalCurrency") ?? "USD")
      }
    });
  }
  await setConfig("orientation_razorpay_enabled", formData.get("razorpayEnabled") === "on" ? "true" : "false");
  await setConfig("orientation_paypal_enabled", formData.get("paypalEnabled") === "on" ? "true" : "false");
  revalidatePath("/admin/orientation-settings");
}

export async function createOrientationSlot(formData: FormData) {
  const orientation = await prisma.program.findUnique({ where: { slug: "orientation" } });
  if (!orientation) return;

  const date = String(formData.get("date"));
  const startTime = String(formData.get("startTime"));
  const endTime = String(formData.get("endTime"));
  const timezone = String(formData.get("timezone") || "Asia/Kolkata");
  const status = String(formData.get("status") || "Draft");
  const autoZoom = formData.get("zoomMode") === "auto";
  const zoomMeetingId = autoZoom ? `${Math.floor(100000000 + Math.random() * 900000000)}` : String(formData.get("zoomMeetingId") ?? "");
  const zoomPassword = autoZoom ? Math.random().toString(36).slice(2, 8).toUpperCase() : String(formData.get("zoomPassword") ?? "");
  const zoomLink = autoZoom ? `https://zoom.us/j/${zoomMeetingId}?pwd=${zoomPassword}` : String(formData.get("zoomLink") ?? "");

  const batch = await prisma.batch.create({
    data: {
      programId: orientation.id,
      startsAt: new Date(`${date}T${startTime}:00`),
      capacity: Number(formData.get("seatCap") ?? 30),
      zoomLink,
      active: status === "Active"
    }
  });

  await Promise.all([
    setConfig(slotKey(batch.id, "endTime"), endTime),
    setConfig(slotKey(batch.id, "timezone"), timezone),
    setConfig(slotKey(batch.id, "status"), status),
    setConfig(slotKey(batch.id, "zoomMeetingId"), zoomMeetingId),
    setConfig(slotKey(batch.id, "zoomPassword"), zoomPassword),
    setConfig(slotKey(batch.id, "waitlistEnabled"), "true"),
    setConfig(slotKey(batch.id, "autoConfirmation"), "true"),
    setConfig(slotKey(batch.id, "reminder24h"), "true"),
    setConfig(slotKey(batch.id, "reminder1h"), "true"),
    setConfig(slotKey(batch.id, "followUp"), "true")
  ]);

  revalidatePath("/admin/orientation-settings");
  revalidatePath("/admin/dashboard");
}

export async function updateSlotStatus(batchId: string, status: string) {
  await prisma.batch.update({ where: { id: batchId }, data: { active: status === "Active" } });
  await setConfig(slotKey(batchId, "status"), status);
  revalidatePath("/admin/orientation-settings");
}

export async function duplicateSlot(batchId: string) {
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) return;
  const duplicate = await prisma.batch.create({
    data: {
      programId: batch.programId,
      startsAt: new Date(batch.startsAt.getTime() + 7 * 24 * 60 * 60 * 1000),
      capacity: batch.capacity,
      zoomLink: batch.zoomLink,
      active: false
    }
  });
  await setConfig(slotKey(duplicate.id, "status"), "Draft");
  await setConfig(slotKey(duplicate.id, "timezone"), "Asia/Kolkata");
  await setConfig(slotKey(duplicate.id, "endTime"), "");
  revalidatePath("/admin/orientation-settings");
}

export async function markOrientationAttendance(bookingId: string, batchId: string, status: AttendanceStatus) {
  await prisma.booking.update({ where: { id: bookingId }, data: { attendanceStatus: status } });
  await prisma.attendance.upsert({
    where: { bookingId },
    create: { bookingId, batchId, status, markedAt: new Date() },
    update: { status, markedAt: new Date() }
  });
  revalidatePath("/admin/orientation-settings");
  revalidatePath("/admin/dashboard");
}

export async function moveRegistrationToSlot(formData: FormData) {
  const bookingId = String(formData.get("bookingId"));
  const batchId = String(formData.get("batchId"));
  const batch = await prisma.batch.findUnique({ where: { id: batchId }, include: { bookings: true } });
  if (!batch || batch.bookings.length >= batch.capacity) return;
  await prisma.booking.update({ where: { id: bookingId }, data: { batchId, attendanceStatus: "NOT_MARKED" } });
  await prisma.attendance.deleteMany({ where: { bookingId } });
  revalidatePath("/admin/orientation-settings");
}

export async function updateSlotAutomation(formData: FormData) {
  const batchId = String(formData.get("batchId"));
  await Promise.all(["autoConfirmation", "reminder24h", "reminder1h", "followUp"].map((key) => setConfig(slotKey(batchId, key), formData.get(key) === "on" ? "true" : "false")));
  revalidatePath("/admin/orientation-settings");
}
