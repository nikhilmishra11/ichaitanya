"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { setMetadataMany } from "@/lib/admin-metadata";

const group = "email-templates";
const key = (id: string, field: string) => `email_template_${id}_${field}`;

export async function saveEmailTemplate(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? (formData.get("active") === "on" ? "Active" : "Draft"));
  const data = {
    name: String(formData.get("name") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    body: String(formData.get("body") ?? formData.get("content") ?? ""),
    active: status === "Active"
  };
  const template = id ? await prisma.emailTemplate.update({ where: { id }, data }) : await prisma.emailTemplate.create({ data: { ...data, key: String(formData.get("templateKey") || data.name.toLowerCase().replace(/\W+/g, "_")) } });
  await setMetadataMany([
    { key: key(template.id, "category"), value: String(formData.get("category") ?? "System"), group },
    { key: key(template.id, "status"), value: status, group },
    { key: key(template.id, "trigger"), value: String(formData.get("trigger") ?? "Manual Email"), group },
    { key: key(template.id, "language"), value: String(formData.get("language") ?? "English"), group },
    { key: key(template.id, "whatsapp"), value: String(formData.get("whatsapp") ?? ""), group },
    { key: key(template.id, "attachments"), value: String(formData.get("attachments") ?? ""), group },
    { key: key(template.id, "lastEditedBy"), value: "Admin", group }
  ]);
  revalidatePath("/admin/email-templates");
}

export async function duplicateEmailTemplate(id: string) {
  const template = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!template) return;
  await prisma.emailTemplate.create({
    data: {
      key: `${template.key}_copy_${Date.now().toString().slice(-4)}`,
      name: `${template.name} Copy`,
      subject: template.subject,
      body: template.body,
      active: false
    }
  });
  revalidatePath("/admin/email-templates");
}

export async function deleteEmailTemplate(id: string) {
  await prisma.emailTemplate.delete({ where: { id } });
  revalidatePath("/admin/email-templates");
}

export async function setEmailTemplateStatus(id: string, status: string) {
  await prisma.emailTemplate.update({ where: { id }, data: { active: status === "Active" } });
  await setMetadataMany([{ key: key(id, "status"), value: status, group }]);
  revalidatePath("/admin/email-templates");
}
