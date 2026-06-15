"use server";

import { AttendanceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const auraSlug = "aura-night";

function auraKey(key: string) {
  return `aura_night_${key}`;
}

async function setConfig(key: string, value: string) {
  await prisma.systemConfig.upsert({
    where: { key },
    create: { key, value, group: "aura-night" },
    update: { value }
  });
}

export async function saveAuraSettings(formData: FormData) {
  const aura = await prisma.program.findUnique({ where: { slug: auraSlug } });
  if (!aura) return;
  const status = String(formData.get("status") ?? "Active");
  await prisma.program.update({
    where: { id: aura.id },
    data: {
      name: String(formData.get("name") ?? aura.name),
      description: String(formData.get("description") ?? aura.description),
      priceIndia: Number(formData.get("indiaPrice") ?? aura.priceIndia),
      priceGlobal: Number(formData.get("internationalPrice") ?? aura.priceGlobal),
      currencyIndia: String(formData.get("indiaCurrency") ?? "INR"),
      currencyGlobal: String(formData.get("internationalCurrency") ?? "USD"),
      schedule: `${String(formData.get("startTime") ?? "21:00")} ${String(formData.get("timezone") ?? "Asia/Kolkata")}`,
      duration: String(formData.get("duration") ?? aura.duration ?? "10 min"),
      zoomLink: String(formData.get("zoomLink") ?? aura.zoomLink ?? ""),
      active: status === "Active"
    }
  });
  await Promise.all([
    setConfig(auraKey("heroTitle"), String(formData.get("heroTitle") ?? "")),
    setConfig(auraKey("status"), status),
    setConfig(auraKey("programType"), String(formData.get("programType") ?? "Rolling Enrollment")),
    setConfig(auraKey("indiaCurrency"), String(formData.get("indiaCurrency") ?? "INR")),
    setConfig(auraKey("internationalCurrency"), String(formData.get("internationalCurrency") ?? "USD")),
    setConfig(auraKey("razorpay"), formData.get("razorpay") === "on" ? "true" : "false"),
    setConfig(auraKey("paypal"), formData.get("paypal") === "on" ? "true" : "false"),
    setConfig(auraKey("discountCodes"), formData.get("discountCodes") === "on" ? "true" : "false"),
    setConfig(auraKey("couponCodes"), formData.get("couponCodes") === "on" ? "true" : "false"),
    setConfig(auraKey("startTime"), String(formData.get("startTime") ?? "21:00")),
    setConfig(auraKey("endTime"), String(formData.get("endTime") ?? "21:10")),
    setConfig(auraKey("timezone"), String(formData.get("timezone") ?? "Asia/Kolkata")),
    setConfig(auraKey("sessionCount"), String(formData.get("sessionCount") ?? "25")),
    setConfig(auraKey("zoomMeetingId"), String(formData.get("zoomMeetingId") ?? "")),
    setConfig(auraKey("zoomPassword"), String(formData.get("zoomPassword") ?? "")),
    setConfig(auraKey("zoomMode"), String(formData.get("zoomMode") ?? "reuse")),
    setConfig(auraKey("reuseZoom"), formData.get("reuseZoom") === "on" ? "true" : "false"),
    setConfig(auraKey("generateDailyZoom"), formData.get("generateDailyZoom") === "on" ? "true" : "false"),
    setConfig(auraKey("autoZoomLinks"), formData.get("autoZoomLinks") === "on" ? "true" : "false")
  ]);
  revalidatePath("/admin/aura-night");
  revalidatePath("/aura-night");
}

export async function saveAuraAutomation(formData: FormData) {
  const keys = [
    "dailyReminder",
    "oneHourReminder",
    "fifteenMinuteReminder",
    "completionCongrats",
    "whatsappWelcome",
    "whatsappDaily",
    "whatsappCompletion",
    "whatsappMissed",
    "emailEnrollment",
    "emailZoom",
    "emailDaily",
    "emailProgress",
    "emailCertificate",
    "certificateMinAttendance",
    "autoCertificate",
    "requestFeedback",
    "requestRating",
    "requestVideo",
    "requestWhatsappScreenshot"
  ];
  await Promise.all(keys.map((key) => setConfig(auraKey(key), formData.get(key) === "on" ? "true" : String(formData.get(key) ?? ""))));
  revalidatePath("/admin/aura-night");
}

export async function saveAuraLanding(formData: FormData) {
  const keys = ["landingHero", "landingDescription", "landingBenefits", "landingFaqs", "landingTestimonials", "landingCta", "seoTitle", "seoDescription", "seoKeywords"];
  await Promise.all(keys.map((key) => setConfig(auraKey(key), String(formData.get(key) ?? ""))));
  revalidatePath("/admin/aura-night");
  revalidatePath("/aura-night");
}

export async function markAuraAttendance(bookingId: string, batchId: string | null, status: AttendanceStatus) {
  await prisma.booking.update({ where: { id: bookingId }, data: { attendanceStatus: status } });
  if (batchId) {
    await prisma.attendance.upsert({
      where: { bookingId },
      create: { bookingId, batchId, status, markedAt: new Date() },
      update: { status, markedAt: new Date() }
    });
  }
  revalidatePath("/admin/aura-night");
  revalidatePath("/admin/dashboard");
}

export async function cancelAuraEnrollment(bookingId: string) {
  await prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });
  revalidatePath("/admin/aura-night");
}
