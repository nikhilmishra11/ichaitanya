import { prisma } from "@/lib/prisma";

export async function GET() {
  const bookings = await prisma.booking.findMany({ include: { program: true, batch: true, payment: true }, orderBy: { registeredAt: "desc" } });
  const rows = bookings.map((b) => ({
    "Booking ID": b.bookingReference,
    Name: b.name,
    Email: b.email,
    "WhatsApp Number": b.phone,
    Country: b.country,
    Program: b.program.name,
    Batch: b.batch?.id ?? "",
    "Session Date": b.batch?.startsAt.toISOString() ?? "",
    "Payment Method": b.payment?.provider ?? "Manual / Pending",
    Amount: b.amount,
    Currency: b.currency,
    "Payment Status": b.status,
    "Attendance Status": b.attendanceStatus,
    "Registration Date": b.registeredAt.toISOString(),
    Notes: b.notes ?? ""
  }));
  const headers = Object.keys(rows[0] ?? { "Booking ID": "" });
  const tableRows = rows.map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(String(row[header as keyof typeof row] ?? ""))}</td>`).join("")}</tr>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "application/vnd.ms-excel",
      "Content-Disposition": "attachment; filename=ichaitanya-bookings.xls"
    }
  });
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
