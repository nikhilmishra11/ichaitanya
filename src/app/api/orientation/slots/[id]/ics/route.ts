import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const slot = await prisma.batch.findUnique({ where: { id }, include: { program: true } });
  if (!slot) return new Response("Slot not found", { status: 404 });

  const start = formatIcsDate(slot.startsAt);
  const end = formatIcsDate(new Date(slot.startsAt.getTime() + 40 * 60 * 1000));
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//iChaitanya//Orientation//EN",
    "BEGIN:VEVENT",
    `UID:${slot.id}@ichaitanya.com`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    "SUMMARY:iChaitanya Orientation",
    `DESCRIPTION:${escapeIcs(slot.zoomLink ?? "Join link will be shared")}`,
    `LOCATION:${escapeIcs(slot.zoomLink ?? "Online")}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar",
      "Content-Disposition": `attachment; filename=orientation-slot-${id.slice(0, 8)}.ics`
    }
  });
}

function formatIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcs(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;");
}
