import { prisma } from "@/lib/prisma";

export async function GET() {
  const testimonials = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } });
  const header = ["Author", "Country", "Type", "Featured", "Published", "Content", "Created"];
  const rows = testimonials.map((item) => [item.name, item.country, item.category, item.featured, item.active, item.content, item.createdAt.toISOString()]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=testimonials.csv" } });
}
