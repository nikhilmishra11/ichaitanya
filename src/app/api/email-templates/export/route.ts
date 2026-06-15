import { prisma } from "@/lib/prisma";

export async function GET() {
  const templates = await prisma.emailTemplate.findMany({ orderBy: { name: "asc" } });
  const header = ["Name", "Subject", "Active", "Updated"];
  const rows = templates.map((item) => [item.name, item.subject, item.active, item.updatedAt.toISOString()]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=email-templates.csv" } });
}
