import { prisma } from "@/lib/prisma";

export function metadataMap(rows: Array<{ key: string; value: string }>) {
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function setMetadata(key: string, value: string, group: string, secret = false) {
  await prisma.systemConfig.upsert({
    where: { key },
    create: { key, value, group, secret },
    update: { value, secret }
  });
}

export async function setMetadataMany(entries: Array<{ key: string; value: string; group: string; secret?: boolean }>) {
  await Promise.all(entries.map((entry) => setMetadata(entry.key, entry.value, entry.group, entry.secret ?? false)));
}

export function dayTrend(dates: Date[], days = 14) {
  return Array.from({ length: days }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    const key = date.toISOString().slice(5, 10);
    return { label: key, value: dates.filter((item) => item.toISOString().slice(5, 10) === key).length };
  });
}
