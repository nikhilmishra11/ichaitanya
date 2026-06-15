import Link from "next/link";
import { BookingStatus, Prisma } from "@prisma/client";
import { Download, FileSpreadsheet, PlusCircle, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookingsLast30DaysChart, DistributionPie } from "./booking-charts";
import { BookingsTable } from "./bookings-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type BookingParams = {
  q?: string;
  program?: string;
  batch?: string;
  status?: string;
  country?: string;
  range?: string;
  method?: string;
  quick?: string;
  page?: string;
  sort?: string;
  dir?: string;
  nameSearch?: string;
  emailSearch?: string;
  phoneSearch?: string;
  countrySearch?: string;
  programSearch?: string;
  batchSearch?: string;
  sessionDateSearch?: string;
};

const pageSize = 20;
const columnSearchKeys = [
  "nameSearch",
  "emailSearch",
  "phoneSearch",
  "countrySearch",
  "programSearch",
  "batchSearch",
  "sessionDateSearch"
];

export default async function BookingsPage({ searchParams }: { searchParams: Promise<BookingParams> }) {
  const params = await searchParams;
  const page = Math.max(Number(params.page ?? 1), 1);
  const where = buildWhere(params);
  const orderBy = buildOrder(params);

  const [programs, batches, countries, allFiltered, bookings, totalCount] = await Promise.all([
    prisma.program.findMany({ orderBy: { name: "asc" } }),
    prisma.batch.findMany({ include: { program: true, bookings: true }, orderBy: { startsAt: "asc" } }),
    prisma.booking.groupBy({ by: ["country"], _count: true, orderBy: { _count: { country: "desc" } } }),
    prisma.booking.findMany({ where, include: { program: true, batch: true, payment: true } }),
    prisma.booking.findMany({
      where,
      include: { program: true, batch: true, payment: true, emailLogs: { include: { template: true }, orderBy: { sentAt: "desc" }, take: 8 } },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.booking.count({ where })
  ]);

  const paid = allFiltered.filter((booking) => booking.status === "PAID");
  const pending = allFiltered.filter((booking) => booking.status === "PENDING");
  const revenue = paid.reduce((sum, booking) => sum + (booking.currency === "USD" ? booking.amount * 83 : booking.amount), 0);
  const pendingRevenue = pending.reduce((sum, booking) => sum + (booking.currency === "USD" ? booking.amount * 83 : booking.amount), 0);
  const now = new Date();
  const todayRegistrations = allFiltered.filter((booking) => sameDay(booking.registeredAt, now)).length;
  const weekRegistrations = allFiltered.filter((booking) => booking.registeredAt >= addDays(now, -7)).length;
  const last30 = buildLast30(allFiltered);
  const countryDistribution = countries
    .filter((country) => allFiltered.some((booking) => booking.country === country.country))
    .slice(0, 6)
    .map((country) => ({ name: country.country, value: allFiltered.filter((booking) => booking.country === country.country).length }));
  const programDistribution = programs.map((program) => ({ name: program.name, value: allFiltered.filter((booking) => booking.programId === program.id).length })).filter((row) => row.value > 0);
  const pageCount = Math.max(Math.ceil(totalCount / pageSize), 1);
  const queryNoPage = new URLSearchParams(Object.entries(params).filter(([key, value]) => key !== "page" && value).map(([key, value]) => [key, String(value)]));
  const batchOptions = batches.map((batch) => ({
    id: batch.id,
    label: `${batch.program.name} - ${batch.startsAt.toLocaleDateString("en-IN")}`,
    available: Math.max(batch.capacity - batch.bookings.length, 0)
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Registration CRM</p>
          <h1 className="font-serif text-4xl font-bold">Bookings</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage meditation registrations, payments, attendance, communications, notes, and reschedules.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="accent"><PlusCircle className="h-4 w-4" /> Add Manual Booking</Button>
          <Button asChild variant="outline"><Link href="/api/bookings/export"><Download className="h-4 w-4" /> Export CSV</Link></Button>
          <Button asChild variant="outline"><Link href="/api/bookings/export/excel"><FileSpreadsheet className="h-4 w-4" /> Export Excel</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat title="Total Bookings" value={allFiltered.length.toString()} />
        <Stat title="Paid Bookings" value={paid.length.toString()} />
        <Stat title="Pending Bookings" value={pending.length.toString()} />
        <Stat title="Revenue" value={formatCurrency(revenue, "INR")} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat title="Today's Registrations" value={todayRegistrations.toString()} />
        <Stat title="This Week Registrations" value={weekRegistrations.toString()} />
        <Stat title="Paid Revenue" value={formatCurrency(revenue, "INR")} />
        <Stat title="Pending Revenue" value={formatCurrency(pendingRevenue, "INR")} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search, filter, sort, and page through bookings server-side.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              ["ALL", "All"],
              ["PAID", "Paid"],
              ["PENDING", "Pending"],
              ["FAILED", "Failed"],
              ["REFUNDED", "Refunded"],
              ["UPCOMING", "Upcoming Sessions"],
              ["PAST", "Past Sessions"]
            ].map(([value, label]) => (
              <Button key={value} asChild size="sm" variant={(params.quick ?? "ALL") === value ? "accent" : "outline"}>
                <Link href={`/admin/bookings?quick=${value}`}>{label}</Link>
              </Button>
            ))}
          </div>
          <form className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input name="q" defaultValue={params.q ?? ""} className="pl-9" placeholder="Search by name, email, WhatsApp, booking ID" />
            </div>
            <Select name="program" value={params.program ?? "ALL"} options={[["ALL", "All Programs"], ...programs.map((p) => [p.id, p.name] as [string, string])]} />
            <Select name="batch" value={params.batch ?? "ALL"} options={[["ALL", "All Batches"], ...batches.slice(0, 40).map((b) => [b.id, `${b.program.name} - ${b.startsAt.toLocaleDateString("en-IN")}`] as [string, string])]} />
            <Select name="status" value={params.status ?? "ALL"} options={[["ALL", "All Payments"], ["PAID", "Paid"], ["PENDING", "Pending"], ["FAILED", "Failed"], ["REFUNDED", "Refunded"]]} />
            <Select name="country" value={params.country ?? "ALL"} options={[["ALL", "All Countries"], ...countries.map((c) => [c.country, c.country] as [string, string])]} />
            <Select name="range" value={params.range ?? "ALL"} options={[["ALL", "All Dates"], ["TODAY", "Today"], ["7D", "Last 7 Days"], ["30D", "Last 30 Days"], ["90D", "Last 90 Days"]]} />
            <Select name="method" value={params.method ?? "ALL"} options={[["ALL", "All Methods"], ["Razorpay", "Razorpay Payments"], ["PayPal", "PayPal Payments"], ["Manual", "Manual Payments"]]} />
            <Select name="sort" value={params.sort ?? "registeredAt"} options={[["registeredAt", "Registration Date"], ["name", "Name"], ["country", "Country"], ["amount", "Amount"], ["status", "Payment Status"]]} />
            <Select name="dir" value={params.dir ?? "desc"} options={[["desc", "Descending"], ["asc", "Ascending"]]} />
            <Button type="submit" variant="accent">Apply</Button>
            <Button asChild variant="outline"><Link href="/admin/bookings">Reset</Link></Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader><CardTitle>Bookings Last 30 Days</CardTitle></CardHeader>
          <CardContent><BookingsLast30DaysChart data={last30} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Country Distribution</CardTitle></CardHeader>
          <CardContent>{countryDistribution.length ? <DistributionPie data={countryDistribution} /> : <EmptyState />}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Program Distribution</CardTitle></CardHeader>
          <CardContent>{programDistribution.length ? <DistributionPie data={programDistribution} /> : <EmptyState />}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Booking Operations</CardTitle>
              <CardDescription>Click a row to view details, reschedule, mark attendance, manage payment, send emails, and update notes.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline"><Link href="/api/bookings/export">Bookings CSV</Link></Button>
              <Button asChild size="sm" variant="outline"><Link href="/api/bookings/export/excel">Bookings Excel</Link></Button>
              <Button asChild size="sm" variant="outline"><Link href="/api/attendance/export">Attendance Report</Link></Button>
              <Button asChild size="sm" variant="outline"><Link href="/api/revenue/export">Revenue Report</Link></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <BookingsTable
            bookings={bookings.map(serializeBooking)}
            batches={batchOptions}
            columnSearch={columnSearchValues(params)}
            preservedParams={preservedFilterEntries(params)}
            clearColumnSearchHref={`/admin/bookings${columnClearQuery(params)}`}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Page {page} of {pageCount} • {totalCount} bookings</p>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" aria-disabled={page <= 1}><Link href={`/admin/bookings?${queryNoPage.toString()}&page=${Math.max(page - 1, 1)}`}>Previous</Link></Button>
          <Button asChild variant="outline" size="sm" aria-disabled={page >= pageCount}><Link href={`/admin/bookings?${queryNoPage.toString()}&page=${Math.min(page + 1, pageCount)}`}>Next</Link></Button>
        </div>
      </div>
    </div>
  );
}

function buildWhere(params: BookingParams): Prisma.BookingWhereInput {
  const now = new Date();
  const range = params.range ?? "ALL";
  const dateFrom = range === "TODAY" ? startOfDay(now) : range === "7D" ? addDays(now, -7) : range === "30D" ? addDays(now, -30) : range === "90D" ? addDays(now, -90) : null;
  const quick = params.quick ?? "ALL";
  const failedStatuses: BookingStatus[] = ["FAILED", "CANCELLED"];
  const sessionDate = parseColumnDate(params.sessionDateSearch);
  const andFilters: Prisma.BookingWhereInput[] = [];

  if (params.q) {
    andFilters.push({ OR: [{ name: { contains: params.q } }, { email: { contains: params.q } }, { phone: { contains: params.q } }, { bookingReference: { contains: params.q } }] });
  }

  if (params.nameSearch) andFilters.push({ name: { contains: params.nameSearch } });
  if (params.emailSearch) andFilters.push({ email: { contains: params.emailSearch } });
  if (params.phoneSearch) andFilters.push({ phone: { contains: params.phoneSearch } });
  if (params.countrySearch) andFilters.push({ country: { contains: params.countrySearch } });
  if (params.programSearch) andFilters.push({ program: { name: { contains: params.programSearch } } });
  if (params.batchSearch) andFilters.push({ batch: { id: { contains: params.batchSearch } } });
  if (sessionDate) andFilters.push({ batch: { startsAt: { gte: sessionDate.start, lt: sessionDate.end } } });
  if (quick === "UPCOMING") andFilters.push({ batch: { startsAt: { gte: now } } });
  if (quick === "PAST") andFilters.push({ batch: { startsAt: { lt: now } } });

  return {
    ...(andFilters.length ? { AND: andFilters } : {}),
    ...(params.program && params.program !== "ALL" ? { programId: params.program } : {}),
    ...(params.batch && params.batch !== "ALL" ? { batchId: params.batch } : {}),
    ...(params.country && params.country !== "ALL" ? { country: params.country } : {}),
    ...(params.method && params.method !== "ALL" ? { payment: { is: { provider: params.method } } } : {}),
    ...(params.status && params.status !== "ALL" ? { status: params.status === "FAILED" ? { in: failedStatuses } : params.status as BookingStatus } : {}),
    ...(quick === "PAID" ? { status: "PAID" } : {}),
    ...(quick === "PENDING" ? { status: "PENDING" } : {}),
    ...(quick === "FAILED" ? { status: { in: failedStatuses } } : {}),
    ...(quick === "REFUNDED" ? { status: "REFUNDED" } : {}),
    ...(dateFrom ? { registeredAt: { gte: dateFrom, lte: now } } : {})
  };
}

function columnClearQuery(params: BookingParams) {
  const query = new URLSearchParams(
    preservedFilterEntries(params)
  );
  const text = query.toString();
  return text ? `?${text}` : "";
}

function preservedFilterEntries(params: BookingParams) {
  return Object.entries(params)
    .filter(([key, value]) => key !== "page" && value && !columnSearchKeys.includes(key))
    .map(([key, value]) => [key, String(value)] as [string, string]);
}

function columnSearchValues(params: BookingParams) {
  return {
    nameSearch: params.nameSearch ?? "",
    emailSearch: params.emailSearch ?? "",
    phoneSearch: params.phoneSearch ?? "",
    countrySearch: params.countrySearch ?? "",
    programSearch: params.programSearch ?? "",
    batchSearch: params.batchSearch ?? "",
    sessionDateSearch: params.sessionDateSearch ?? ""
  };
}

function parseColumnDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const start = startOfDay(date);
  return { start, end: addDays(start, 1) };
}

function buildOrder(params: BookingParams): Prisma.BookingOrderByWithRelationInput {
  const dir = params.dir === "asc" ? "asc" : "desc";
  const sort = params.sort ?? "registeredAt";
  if (sort === "name" || sort === "country" || sort === "amount" || sort === "status") return { [sort]: dir };
  return { registeredAt: dir };
}

function serializeBooking(booking: Prisma.BookingGetPayload<{ include: { program: true; batch: true; payment: true; emailLogs: { include: { template: true } } } }>) {
  return {
    id: booking.id,
    bookingReference: booking.bookingReference,
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    country: booking.country,
    status: booking.status,
    attendanceStatus: booking.attendanceStatus,
    amount: booking.amount,
    currency: booking.currency,
    notes: booking.notes,
    registeredAt: booking.registeredAt.toISOString(),
    program: { id: booking.program.id, name: booking.program.name },
    batch: booking.batch ? { id: booking.batch.id, startsAt: booking.batch.startsAt.toISOString(), capacity: booking.batch.capacity, zoomLink: booking.batch.zoomLink } : null,
    payment: booking.payment ? { transactionId: booking.payment.transactionId, provider: booking.payment.provider, amount: booking.payment.amount, currency: booking.payment.currency, status: booking.payment.status, paidAt: booking.payment.paidAt?.toISOString() ?? null } : null,
    emailLogs: booking.emailLogs.map((log) => ({ id: log.id, subject: log.subject, status: log.status, sentAt: log.sentAt.toISOString(), templateName: log.template?.name ?? null }))
  };
}

function buildLast30(bookings: Array<{ registeredAt: Date }>) {
  return Array.from({ length: 30 }).map((_, index) => {
    const date = addDays(new Date(), -(29 - index));
    const key = date.toISOString().slice(5, 10);
    return { date: key, count: bookings.filter((booking) => booking.registeredAt.toISOString().slice(5, 10) === key).length };
  });
}

function Stat({ title, value }: { title: string; value: string }) {
  return <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-3xl font-bold">{value}</p></CardContent></Card>;
}

function Select({ name, value, options }: { name: string; value: string; options: Array<[string, string]> }) {
  return <select name={name} defaultValue={value} className="h-10 rounded-md border bg-background px-3 text-sm">{options.map(([optionValue, label]) => <option key={`${name}-${optionValue}`} value={optionValue}>{label}</option>)}</select>;
}

function EmptyState() {
  return <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center"><p className="font-semibold">No bookings found</p><p className="mt-2 text-sm text-muted-foreground">Adjust filters or clear the quick filter to see more records.</p></div>;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
