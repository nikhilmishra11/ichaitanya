"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { setMetadataMany } from "@/lib/admin-metadata";

const group = "testimonials";
const key = (id: string, field: string) => `testimonial_${id}_${field}`;

export async function saveTestimonial(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "Draft");
  const data = {
    name: String(formData.get("authorName") || formData.get("name") || ""),
    country: String(formData.get("country") ?? ""),
    category: String(formData.get("type") ?? "Text Testimonial"),
    content: String(formData.get("content") ?? ""),
    featured: formData.get("featured") === "on" || status === "Featured",
    active: status === "Published" || status === "Featured"
  };
  const testimonial = id ? await prisma.testimonial.update({ where: { id }, data }) : await prisma.testimonial.create({ data });
  await setMetadataMany([
    { key: key(testimonial.id, "displayName"), value: String(formData.get("displayName") ?? data.name), group },
    { key: key(testimonial.id, "email"), value: String(formData.get("email") ?? ""), group },
    { key: key(testimonial.id, "phone"), value: String(formData.get("phone") ?? ""), group },
    { key: key(testimonial.id, "city"), value: String(formData.get("city") ?? ""), group },
    { key: key(testimonial.id, "occupation"), value: String(formData.get("occupation") ?? ""), group },
    { key: key(testimonial.id, "photo"), value: String(formData.get("photo") ?? ""), group },
    { key: key(testimonial.id, "programs"), value: String(formData.get("programs") ?? ""), group },
    { key: key(testimonial.id, "headline"), value: String(formData.get("headline") ?? ""), group },
    { key: key(testimonial.id, "summary"), value: String(formData.get("summary") ?? ""), group },
    { key: key(testimonial.id, "before"), value: String(formData.get("before") ?? ""), group },
    { key: key(testimonial.id, "after"), value: String(formData.get("after") ?? ""), group },
    { key: key(testimonial.id, "benefits"), value: String(formData.get("benefits") ?? ""), group },
    { key: key(testimonial.id, "rating"), value: String(formData.get("rating") ?? "5"), group },
    { key: key(testimonial.id, "recommend"), value: String(formData.get("recommend") ?? "Yes"), group },
    { key: key(testimonial.id, "videoUrl"), value: String(formData.get("videoUrl") ?? ""), group },
    { key: key(testimonial.id, "thumbnail"), value: String(formData.get("thumbnail") ?? ""), group },
    { key: key(testimonial.id, "mediaUrls"), value: String(formData.get("mediaUrls") ?? ""), group },
    { key: key(testimonial.id, "status"), value: status, group },
    { key: key(testimonial.id, "homepageFeatured"), value: formData.get("homepageFeatured") === "on" ? "true" : "false", group },
    { key: key(testimonial.id, "programFeatured"), value: formData.get("programFeatured") === "on" ? "true" : "false", group },
    { key: key(testimonial.id, "displayOrder"), value: String(formData.get("displayOrder") ?? "0"), group },
    { key: key(testimonial.id, "metaTitle"), value: String(formData.get("metaTitle") ?? ""), group },
    { key: key(testimonial.id, "metaDescription"), value: String(formData.get("metaDescription") ?? ""), group },
    { key: key(testimonial.id, "shareImage"), value: String(formData.get("shareImage") ?? ""), group }
  ]);
  revalidatePath("/admin/testimonials");
  revalidatePath("/testimonials");
}

export async function createTestimonial(formData: FormData) {
  await saveTestimonial(formData);
}

export async function setTestimonialStatus(id: string, status: string) {
  await prisma.testimonial.update({ where: { id }, data: { active: status === "Published" || status === "Featured", featured: status === "Featured" } });
  await setMetadataMany([{ key: key(id, "status"), value: status, group }]);
  revalidatePath("/admin/testimonials");
  revalidatePath("/testimonials");
}

export async function deleteTestimonial(id: string) {
  await prisma.testimonial.delete({ where: { id } });
  revalidatePath("/admin/testimonials");
  revalidatePath("/testimonials");
}
