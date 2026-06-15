import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const slot = await prisma.batch.findUnique({
    where: { id },
    include: { program: true, bookings: true }
  });
  if (!slot) return new Response("Slot not found", { status: 404 });

  const header = ["Name", "Email", "WhatsApp", "Country", "Payment Status", "Attendance Status", "Amount", "Currency"];
  const rows = slot.bookings.map((booking) => [booking.name, booking.email, booking.phone, booking.country, booking.status, booking.attendanceStatus, booking.amount, booking.currency]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=orientation-slot-${id.slice(0, 8)}-participants.csv`
    }
  });
}
