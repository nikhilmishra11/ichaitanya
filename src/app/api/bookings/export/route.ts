import { prisma } from "@/lib/prisma";

export async function GET() {
  const bookings = await prisma.booking.findMany({ include: { program: true, batch: true, payment: true }, orderBy: { registeredAt: "desc" } });
  const header = ["Booking ID", "Name", "Email", "WhatsApp Number", "Country", "Program", "Batch", "Session Date", "Payment Method", "Amount", "Currency", "Payment Status", "Attendance Status", "Registration Date", "Notes"];
  const rows = bookings.map((b) => [
    b.bookingReference,
    b.name,
    b.email,
    b.phone,
    b.country,
    b.program.name,
    b.batch?.id ?? "",
    b.batch?.startsAt.toISOString() ?? "",
    b.payment?.provider ?? "Manual / Pending",
    b.amount,
    b.currency,
    b.status,
    b.attendanceStatus,
    b.registeredAt.toISOString(),
    b.notes ?? ""
  ]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=ichaitanya-bookings.csv"
    }
  });
}
