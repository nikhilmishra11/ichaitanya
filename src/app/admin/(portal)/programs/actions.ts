"use server";

import { ProgramType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function programKey(programId: string, key: string) {
  return `program_${programId}_${key}`;
}

async function setConfig(key: string, value: string, group = "program") {
  await prisma.systemConfig.upsert({
    where: { key },
    create: { key, value, group },
    update: { value }
  });
}

async function safeAdminAction(label: string, paths: string[], action: () => Promise<void>) {
  try {
    await action();
  } catch (error) {
    console.warn(`${label} unavailable; keeping admin route stable.`, error);
  } finally {
    paths.forEach((path) => revalidatePath(path));
  }
}

export async function saveProgram(formData: FormData) {
  await safeAdminAction("Program save", ["/admin/programs"], async () => {
    const id = String(formData.get("id") ?? "");
    const typeValue = String(formData.get("type") ?? "ORIENTATION");
    const customType = String(formData.get("customType") ?? "");
    const pricingEnabled = formData.get("pricingEnabled") === "on";
    const freeProgram = formData.get("freeProgram") === "on";
    const data = {
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? "").toLowerCase().replace(/\s+/g, "-"),
      type: (typeValue === "CUSTOM" ? "ORIENTATION" : typeValue) as ProgramType,
      description: String(formData.get("shortDescription") || formData.get("description") || ""),
      priceIndia: freeProgram ? 0 : Number(formData.get("indiaPrice") ?? formData.get("priceIndia") ?? 0),
      priceGlobal: freeProgram ? 0 : Number(formData.get("internationalPrice") ?? formData.get("priceGlobal") ?? 0),
      currencyIndia: "INR",
      currencyGlobal: "USD",
      schedule: String(formData.get("schedule") ?? "Schedule TBD"),
      duration: String(formData.get("duration") ?? ""),
      zoomLink: String(formData.get("zoomLink") ?? ""),
      active: String(formData.get("status") ?? "Active") === "Active" || formData.get("active") === "on"
    };

    const program = id ? await prisma.program.update({ where: { id }, data }) : await prisma.program.create({ data });
    const status = String(formData.get("status") ?? (data.active ? "Active" : "Draft"));
    await Promise.all([
      setConfig(programKey(program.id, "status"), status),
      setConfig(programKey(program.id, "typeLabel"), typeValue === "CUSTOM" ? customType || "Custom Program" : typeValue),
      setConfig(programKey(program.id, "difficulty"), String(formData.get("difficulty") ?? "Beginner")),
      setConfig(programKey(program.id, "coverImage"), String(formData.get("coverImage") ?? "")),
      setConfig(programKey(program.id, "bannerImage"), String(formData.get("bannerImage") ?? "")),
      setConfig(programKey(program.id, "pricingEnabled"), pricingEnabled ? "true" : "false"),
      setConfig(programKey(program.id, "freeProgram"), freeProgram ? "true" : "false"),
      setConfig(programKey(program.id, "razorpay"), formData.get("razorpay") === "on" ? "true" : "false"),
      setConfig(programKey(program.id, "paypal"), formData.get("paypal") === "on" ? "true" : "false")
    ]);
    revalidatePath(`/programs/${program.slug}`);
  });
}

export async function saveProgramContent(formData: FormData) {
  await safeAdminAction("Program content save", ["/admin/programs"], async () => {
    const programId = String(formData.get("programId"));
    const keys = ["heroTitle", "heroSubtitle", "overview", "benefits", "whoShouldJoin", "whatYouWillLearn", "faq", "cta", "testimonials", "metaTitle", "metaDescription", "keywords", "openGraphImage", "canonicalUrl", "registrationEmail", "paymentEmail", "reminderEmail", "followUpEmail", "completionEmail"];
    await Promise.all(keys.map((key) => setConfig(programKey(programId, key), String(formData.get(key) ?? ""))));
    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (program) revalidatePath(`/programs/${program.slug}`);
  });
}

export async function toggleProgram(id: string, active: boolean) {
  await safeAdminAction("Program toggle", ["/admin/programs"], async () => {
    await prisma.program.update({ where: { id }, data: { active } });
    await setConfig(programKey(id, "status"), active ? "Active" : "Closed");
  });
}

export async function setProgramStatus(id: string, status: string) {
  await safeAdminAction("Program status update", ["/admin/programs"], async () => {
    await prisma.program.update({ where: { id }, data: { active: status === "Active" } });
    await setConfig(programKey(id, "status"), status);
  });
}

export async function duplicateProgram(id: string) {
  await safeAdminAction("Program duplicate", ["/admin/programs"], async () => {
    const program = await prisma.program.findUnique({ where: { id } });
    if (!program) return;
    const duplicate = await prisma.program.create({
      data: {
        name: `${program.name} Copy`,
        slug: `${program.slug}-copy-${Date.now().toString().slice(-4)}`,
        type: program.type,
        description: program.description,
        priceIndia: program.priceIndia,
        priceGlobal: program.priceGlobal,
        currencyIndia: program.currencyIndia,
        currencyGlobal: program.currencyGlobal,
        schedule: program.schedule,
        duration: program.duration,
        zoomLink: program.zoomLink,
        active: false
      }
    });
    await setConfig(programKey(duplicate.id, "status"), "Draft");
  });
}

export async function deleteProgram(id: string) {
  await safeAdminAction("Program delete", ["/admin/programs"], async () => {
    await prisma.program.delete({ where: { id } });
  });
}

export async function createProgramBatch(formData: FormData) {
  await safeAdminAction("Program batch create", ["/admin/programs"], async () => {
    const programId = String(formData.get("programId"));
    const date = String(formData.get("date"));
    const time = String(formData.get("time"));
    await prisma.batch.create({
      data: {
        programId,
        startsAt: new Date(`${date}T${time}:00`),
        capacity: Number(formData.get("capacity") ?? 30),
        zoomLink: String(formData.get("zoomLink") ?? ""),
        active: String(formData.get("status") ?? "Active") === "Active"
      }
    });
  });
}
