import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const programs = await prisma.program.findMany({ include: { bookings: true }, orderBy: { name: "asc" } });
  const header = ["Program", "Registered", "Attended", "No Show", "Attendance Rate"];
  const rows = programs.map((program) => {
    const registered = program.bookings.length;
    const attended = program.bookings.filter((booking) => booking.attendanceStatus === "ATTENDED").length;
    const noShow = program.bookings.filter((booking) => booking.attendanceStatus === "NO_SHOW").length;
    const rate = registered ? Math.round((attended / registered) * 100) : 0;
    return [program.name, registered, attended, noShow, `${rate}%`];
  });
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=ichaitanya-attendance.csv"
    }
  });
}
