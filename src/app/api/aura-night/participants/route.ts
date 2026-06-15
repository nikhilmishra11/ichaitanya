import { prisma } from "@/lib/prisma";

export async function GET() {
  const aura = await prisma.program.findUnique({ where: { slug: "aura-night" }, include: { bookings: true } });
  if (!aura) return new Response("Aura Night not found", { status: 404 });
  const header = ["Name", "Email", "Phone", "Country", "Journey Start Date", "Payment Status", "Attendance Status", "Amount", "Currency"];
  const rows = aura.bookings.map((booking) => [booking.name, booking.email, booking.phone, booking.country, booking.registeredAt.toISOString(), booking.status, booking.attendanceStatus, booking.amount, booking.currency]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=aura-night-participants.csv"
    }
  });
}
