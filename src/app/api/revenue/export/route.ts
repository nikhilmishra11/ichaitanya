import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const payments = await prisma.payment.findMany({
    where: { status: BookingStatus.PAID },
    include: { booking: { include: { program: true } } },
    orderBy: { paidAt: "desc" }
  });
  const header = ["Transaction ID", "Program", "Name", "Email", "Amount", "Currency", "Provider", "Paid At"];
  const rows = payments.map((payment) => [
    payment.transactionId,
    payment.booking.program.name,
    payment.booking.name,
    payment.booking.email,
    payment.amount,
    payment.currency,
    payment.provider,
    payment.paidAt?.toISOString() ?? ""
  ]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=ichaitanya-revenue.csv"
    }
  });
}
