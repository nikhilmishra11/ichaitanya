import { prisma } from "@/lib/prisma";

export async function GET() {
  const logs = await prisma.emailLog.findMany({ include: { template: true }, orderBy: { sentAt: "desc" } });
  const header = ["Recipient", "Template", "Subject", "Status", "Sent At"];
  const rows = logs.map((log) => [log.recipient, log.template?.name ?? "", log.subject, log.status, log.sentAt.toISOString()]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=email-logs.csv" } });
}
