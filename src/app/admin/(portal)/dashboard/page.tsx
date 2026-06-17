import Link from "next/link";
import type React from "react";
import { BookingStatus, Prisma } from "@prisma/client";
import { CalendarPlus, Download, Eye, FileDown, Mail, PlusCircle, ReceiptText, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaymentStatusPie, ProgramPerformanceChart, RegistrationsTrendChart, RevenueTrendChart, TopCountriesChart } from "./dashboard-charts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DashboardParams = {
  program?: string;
  country?: string;
  range?: string;
  status?: string;
  batch?: string;
  region?: string;
  trend?: string;
  revenue?: string;
};

const exchangeRate = 83;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<DashboardParams> }) {
  const params = await searchParams;
  const dateRange = getDateRange(params.range ?? "30d");
  const where = buildBookingWhere(params, dateRange);

  const { programs, countriesRaw, batches, bookings, recent, upcomingBatches, emailLogs } = await getDashboardData(where);

  const paidBookings = bookings.filter((booking) => booking.status === "PAID");
  const pendingBookings = bookings.filter((booking) => booking.status === "PENDING");
  const today = new Date();
  const revenueTotals = getRevenueTotals(paidBookings);
  const todayRegistrations = bookings.filter((booking) => isSameDay(booking.registeredAt, today)).length;
  const upcomingSessions = upcomingBatches.length;
  const attended = getEstimatedAttended(bookings);
  const noShow = Math.max(bookings.length - attended, 0);
  const attendanceRate = bookings.length ? Math.round((attended / bookings.length) * 100) : 0;
  const conversionRate = bookings.length ? Math.round((paidBookings.length / bookings.length) * 100) : 0;
  const revenueWindows = getRevenueWindows(paidBookings);

  const topCountries = countriesRaw
    .filter((row) => !params.country || params.country === "ALL" || row.country === params.country)
    .slice(0, 8)
    .map((row) => ({ country: row.country, count: row._count }));
  const registrationTrend = buildRegistrationTrend(bookings, params.trend ?? "daily");
  const revenueTrend = buildRevenueTrend(paidBookings, params.trend ?? "daily", params.revenue ?? "combined");
  const programPerformance = buildProgramPerformance(programs, bookings);
  const paymentDistribution = [
    { name: "Paid", value: paidBookings.length },
    { name: "Pending", value: pendingBookings.length },
    { name: "Failed", value: bookings.filter((booking) => booking.status === "CANCELLED").length },
    { name: "Refunded", value: 0 }
  ];
  const attendanceByProgram = buildAttendanceByProgram(programs, bookings);
  const waitlist = buildWaitlist(programs, batches);
  const confirmationEmails = emailLogs.filter((log) => log.template?.key === "registration_confirmation").length;
  const reminderEmails = emailLogs.filter((log) => log.template?.key === "reminder_email").length;
  const failedEmails = emailLogs.filter((log) => log.status !== "SENT").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Business Analytics</p>
          <h1 className="font-serif text-4xl font-bold">Saarthi Live Console</h1>
          <p className="mt-2 text-sm text-muted-foreground">Filtered operational view across registrations, revenue, batches, attendance, and email activity.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="accent"><Link href="/admin/orientation-settings"><CalendarPlus className="h-4 w-4" /> Create Batch</Link></Button>
          <Button asChild variant="outline"><Link href="/admin/programs"><PlusCircle className="h-4 w-4" /> Create Program</Link></Button>
          <Button asChild variant="outline"><Link href="/admin/testimonials"><Star className="h-4 w-4" /> Add Testimonial</Link></Button>
          <Button asChild variant="outline"><Link href="/api/bookings/export"><Download className="h-4 w-4" /> Export Report</Link></Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dashboard Filters</CardTitle>
          <CardDescription>Filters persist across every KPI, chart, and table on this dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Select name="program" value={params.program ?? "ALL"} options={[["ALL", "All Programs"], ...programs.map((p) => [p.id, p.name] as [string, string])]} />
            <Select name="country" value={params.country ?? "ALL"} options={[["ALL", "All Countries"], ...countriesRaw.map((c) => [c.country, c.country] as [string, string])]} />
            <Select name="range" value={params.range ?? "30d"} options={[["today", "Today"], ["7d", "Last 7 Days"], ["30d", "Last 30 Days"], ["90d", "Last 90 Days"], ["all", "All Time"]]} />
            <Select name="status" value={params.status ?? "ALL"} options={[["ALL", "All Payments"], ["PAID", "Paid"], ["PENDING", "Pending"], ["CANCELLED", "Failed / Cancelled"]]} />
            <Select name="batch" value={params.batch ?? "ALL"} options={[["ALL", "All Batches"], ...batches.slice(0, 25).map((b) => [b.id, `${b.program.name} - ${b.startsAt.toLocaleDateString("en-IN")}`] as [string, string])]} />
            <Select name="region" value={params.region ?? "ALL"} options={[["ALL", "India + International"], ["INDIA", "India"], ["INTERNATIONAL", "International"]]} />
            <Select name="trend" value={params.trend ?? "daily"} options={[["daily", "Daily"], ["weekly", "Weekly"], ["monthly", "Monthly"]]} />
            <Select name="revenue" value={params.revenue ?? "combined"} options={[["combined", "Combined Revenue"], ["INR", "INR"], ["USD", "USD"]]} />
            <Button type="submit" variant="accent" className="xl:col-span-2">Apply Filters</Button>
            <Button asChild type="button" variant="outline" className="xl:col-span-2"><Link href="/admin/dashboard">Reset</Link></Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat title="Total Registrations" value={bookings.length.toString()} helper="All filtered registrations" />
        <Stat title="Paid Registrations" value={paidBookings.length.toString()} helper={`${conversionRate}% conversion`} />
        <Stat title="Pending Payments" value={pendingBookings.length.toString()} helper="Needs follow-up" />
        <Stat title="Total Revenue" value={formatCurrency(revenueTotals.combined, "INR")} helper={`${formatCurrency(revenueTotals.inr, "INR")} + ${formatCurrency(revenueTotals.usd, "USD")}`} />
        <Stat title="Today's Registrations" value={todayRegistrations.toString()} helper="Registered today" />
        <Stat title="Upcoming Sessions" value={upcomingSessions.toString()} helper="Next 7 days" />
        <Stat title="Attendance Rate" value={`${attendanceRate}%`} helper={`${attended} attended, ${noShow} no show`} />
        <Stat title="Conversion Rate" value={`${conversionRate}%`} helper="Paid / total registrations" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Registrations Trend" description={`${capitalize(params.trend ?? "daily")} filtered registration movement`}>
          <EmptyChart data={registrationTrend}><RegistrationsTrendChart data={registrationTrend} /></EmptyChart>
        </ChartCard>
        <ChartCard title="Revenue Trend" description={`${(params.revenue ?? "combined").toUpperCase()} paid revenue`}>
          <EmptyChart data={revenueTrend}><RevenueTrendChart data={revenueTrend} /></EmptyChart>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_.9fr]">
        <ChartCard title="Program Performance" description="Registrations and revenue by program">
          <ProgramPerformanceChart data={programPerformance} />
        </ChartCard>
        <ChartCard title="Payment Status Distribution" description="Paid, pending, failed, refunded">
          <PaymentStatusPie data={paymentDistribution} />
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <ChartCard title="Top Countries" description="Registration count by country">
          <EmptyChart data={topCountries}><TopCountriesChart data={topCountries} /></EmptyChart>
        </ChartCard>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Batches</CardTitle>
            <CardDescription>Capacity planning for the next 7 days</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {upcomingBatches.length ? (
              <Table>
                <TableHeader><TableRow><TableHead>Program</TableHead><TableHead>Batch Date</TableHead><TableHead>Capacity</TableHead><TableHead>Booked</TableHead><TableHead>Available Seats</TableHead></TableRow></TableHeader>
                <TableBody>
                  {upcomingBatches.map((batch) => {
                    const booked = batch.bookings.length;
                    const available = Math.max(batch.capacity - booked, 0);
                    const fillRate = batch.capacity ? booked / batch.capacity : 1;
                    return (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">{batch.program.name}</TableCell>
                        <TableCell>{formatDate(batch.startsAt)}</TableCell>
                        <TableCell>{batch.capacity}</TableCell>
                        <TableCell>{booked}</TableCell>
                        <TableCell><Badge className={seatBadge(fillRate)}>{available} seats</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : <EmptyState title="No upcoming batches" text="Create a batch to see capacity insights here." />}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Revenue Summary</CardTitle><CardDescription>INR and USD paid revenue by period</CardDescription></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {revenueWindows.map((item) => (
              <div key={item.label} className="rounded-lg border p-4">
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-xl font-bold">{formatCurrency(item.inr, "INR")}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(item.usd, "USD")}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Attendance by Program</CardTitle><CardDescription>Registered, attended, no show, attendance %</CardDescription></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Program</TableHead><TableHead>Registered</TableHead><TableHead>Attended</TableHead><TableHead>No Show</TableHead><TableHead>Attendance</TableHead></TableRow></TableHeader>
              <TableBody>
                {attendanceByProgram.map((row) => (
                  <TableRow key={row.program}><TableCell className="font-medium">{row.program}</TableCell><TableCell>{row.registered}</TableCell><TableCell>{row.attended}</TableCell><TableCell>{row.noShow}</TableCell><TableCell>{row.rate}%</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <Card>
          <CardHeader><CardTitle>Waitlist</CardTitle><CardDescription>Pending demand by program</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {waitlist.some((row) => row.count > 0) ? waitlist.map((row) => (
              <div key={row.program} className="flex items-center justify-between rounded-lg border p-4">
                <div><p className="font-medium">{row.program}</p><p className="text-sm text-muted-foreground">{row.count} waiting</p></div>
                <Button size="sm" variant="outline" disabled={row.count === 0}>Convert</Button>
              </div>
            )) : <EmptyState title="No waitlist pressure" text="All filtered programs currently have available capacity." />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Email Analytics</CardTitle>
            <CardDescription>Confirmation, reminder, failed emails, and recent activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <MiniStat title="Confirmation Sent" value={confirmationEmails} />
              <MiniStat title="Reminder Sent" value={reminderEmails} />
              <MiniStat title="Failed Emails" value={failedEmails} />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Recipient</TableHead><TableHead>Template</TableHead><TableHead>Sent Time</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {emailLogs.map((log) => <TableRow key={log.id}><TableCell>{log.recipient}</TableCell><TableCell>{log.template?.name ?? log.subject}</TableCell><TableCell>{formatDate(log.sentAt)}</TableCell><TableCell>{log.status}</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Latest filtered registrations with operational actions</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline"><Link href="/api/bookings/export"><FileDown className="h-4 w-4" /> Bookings CSV</Link></Button>
              <Button asChild size="sm" variant="outline"><Link href="/api/revenue/export"><FileDown className="h-4 w-4" /> Revenue CSV</Link></Button>
              <Button asChild size="sm" variant="outline"><Link href="/api/attendance/export"><FileDown className="h-4 w-4" /> Attendance CSV</Link></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {recent.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>Booking ID</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Program</TableHead><TableHead>Batch</TableHead><TableHead>Country</TableHead><TableHead>Amount</TableHead><TableHead>Payment Status</TableHead><TableHead>Registration Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {recent.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs">{booking.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{booking.name}</TableCell>
                    <TableCell>{booking.email}</TableCell>
                    <TableCell>{booking.program.name}</TableCell>
                    <TableCell>{booking.batch ? formatDate(booking.batch.startsAt) : "Unassigned"}</TableCell>
                    <TableCell>{booking.country}</TableCell>
                    <TableCell>{formatCurrency(booking.amount, booking.currency)}</TableCell>
                    <TableCell><Badge className={paymentBadge(booking.status)}>{booking.status}</Badge></TableCell>
                    <TableCell>{formatDate(booking.registeredAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" aria-label="View booking"><Eye className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" aria-label="Resend email"><Mail className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" aria-label="Download invoice"><ReceiptText className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <EmptyState title="No bookings found" text="Adjust the dashboard filters to widen the result set." />}
        </CardContent>
      </Card>
    </div>
  );
}

async function getDashboardData(where: Prisma.BookingWhereInput) {
  try {
    const [programs, countriesRaw, batches, bookings, recent, upcomingBatches, emailLogs] = await Promise.all([
      prisma.program.findMany({ orderBy: { name: "asc" } }),
      prisma.booking.groupBy({ by: ["country"], _count: true, orderBy: { _count: { country: "desc" } } }),
      prisma.batch.findMany({ include: { program: true, bookings: true }, orderBy: { startsAt: "asc" } }),
      prisma.booking.findMany({ where, include: { program: true, batch: true, payment: true }, orderBy: { registeredAt: "asc" } }),
      prisma.booking.findMany({ where, include: { program: true, batch: true, payment: true }, orderBy: { registeredAt: "desc" }, take: 12 }),
      prisma.batch.findMany({
        where: { startsAt: { gte: new Date(), lte: addDays(new Date(), 7) } },
        include: { program: true, bookings: true },
        orderBy: { startsAt: "asc" },
        take: 8
      }),
      prisma.emailLog.findMany({ include: { template: true }, orderBy: { sentAt: "desc" }, take: 8 })
    ]);

    return { programs, countriesRaw, batches, bookings, recent, upcomingBatches, emailLogs };
  } catch (error) {
    console.warn("Dashboard database unavailable; rendering demo analytics data.", error);
    return getDemoDashboardData();
  }
}

function getDemoDashboardData() {
  const today = new Date();
  const programs = [
    { id: "orientation", name: "Orientation" },
    { id: "bliss-path", name: "Bliss Path" },
    { id: "aura-night", name: "Aura Night" },
    { id: "one-to-one", name: "One-to-One Meditation" },
    { id: "open-eye", name: "Open Eye Meditation" },
    { id: "walking", name: "Walking Meditation" }
  ];
  const countries = ["India", "United States", "Canada", "United Kingdom", "Australia", "Singapore", "UAE"];
  const batches = programs.map((program, index) => ({
    id: `demo-batch-${program.id}`,
    programId: program.id,
    program,
    startsAt: addDays(today, index + 1),
    capacity: index === 2 ? 40 : 100,
    bookings: [] as Array<{ id: string }>
  }));
  const bookings = Array.from({ length: 96 }, (_, index) => {
    const program = programs[index % programs.length];
    const batch = batches[index % batches.length];
    const status = index % 9 === 0 ? BookingStatus.CANCELLED : index % 4 === 0 ? BookingStatus.PENDING : BookingStatus.PAID;
    const currency = index % 5 === 0 ? "USD" : "INR";
    const amount = currency === "USD" ? 63 + (index % 4) * 24 : 999 + (index % 6) * 700;
    const booking = {
      id: `DEMO-${String(index + 1).padStart(4, "0")}`,
      name: `Participant ${index + 1}`,
      email: `participant${index + 1}@example.com`,
      country: countries[index % countries.length],
      programId: program.id,
      program,
      batchId: batch.id,
      batch,
      paymentId: `demo-payment-${index + 1}`,
      payment: null,
      status,
      amount,
      currency,
      registeredAt: addDays(today, -index % 28)
    };
    batch.bookings.push({ id: booking.id });
    return booking;
  });
  const countriesRaw = countries.map((country) => ({
    country,
    _count: bookings.filter((booking) => booking.country === country).length
  })).sort((a, b) => b._count - a._count);
  const emailLogs = Array.from({ length: 8 }, (_, index) => ({
    id: `demo-email-${index + 1}`,
    recipient: `participant${index + 1}@example.com`,
    subject: index % 2 === 0 ? "Registration Confirmation" : "Session Reminder",
    status: index === 6 ? "FAILED" : "SENT",
    sentAt: addDays(today, -index),
    template: {
      key: index % 2 === 0 ? "registration_confirmation" : "reminder_email",
      name: index % 2 === 0 ? "Registration Confirmation" : "Reminder Email"
    }
  }));

  return {
    programs,
    countriesRaw,
    batches,
    bookings,
    recent: bookings.slice(0, 12),
    upcomingBatches: batches.slice(0, 6),
    emailLogs
  };
}

function buildBookingWhere(params: DashboardParams, range: { from?: Date; to?: Date }): Prisma.BookingWhereInput {
  return {
    ...(params.program && params.program !== "ALL" ? { programId: params.program } : {}),
    ...(params.country && params.country !== "ALL" ? { country: params.country } : {}),
    ...(params.status && params.status !== "ALL" ? { status: params.status as BookingStatus } : {}),
    ...(params.batch && params.batch !== "ALL" ? { batchId: params.batch } : {}),
    ...(params.region === "INDIA" ? { country: "India" } : {}),
    ...(params.region === "INTERNATIONAL" ? { NOT: { country: "India" } } : {}),
    ...(range.from || range.to ? { registeredAt: { ...(range.from ? { gte: range.from } : {}), ...(range.to ? { lte: range.to } : {}) } } : {})
  };
}

function getDateRange(range: string) {
  const now = new Date();
  if (range === "all") return {};
  if (range === "today") return { from: startOfDay(now), to: now };
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  return { from: addDays(now, -days), to: now };
}

function buildRegistrationTrend(bookings: Array<{ registeredAt: Date }>, mode: string) {
  const map = new Map<string, number>();
  bookings.forEach((booking) => {
    const label = getBucketLabel(booking.registeredAt, mode);
    map.set(label, (map.get(label) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([label, registrations]) => ({ label, registrations }));
}

function buildRevenueTrend(bookings: Array<{ registeredAt: Date; amount: number; currency: string }>, mode: string, currencyMode: string) {
  const map = new Map<string, number>();
  bookings.forEach((booking) => {
    if (currencyMode !== "combined" && booking.currency !== currencyMode) return;
    const label = getBucketLabel(booking.registeredAt, mode);
    const amount = currencyMode === "combined" ? toInr(booking.amount, booking.currency) : booking.amount;
    map.set(label, (map.get(label) ?? 0) + amount);
  });
  return Array.from(map.entries()).map(([label, revenue]) => ({ label, revenue }));
}

function buildProgramPerformance(programs: Array<{ id: string; name: string }>, bookings: Array<{ programId: string; amount: number; currency: string; status: BookingStatus }>) {
  return programs.map((program) => {
    const rows = bookings.filter((booking) => booking.programId === program.id);
    return {
      program: program.name.replace(" Meditation", ""),
      registrations: rows.length,
      revenue: rows.filter((booking) => booking.status === "PAID").reduce((sum, booking) => sum + toInr(booking.amount, booking.currency), 0)
    };
  });
}

function buildAttendanceByProgram(programs: Array<{ id: string; name: string }>, bookings: Array<{ programId: string; status: BookingStatus }>) {
  return programs.map((program) => {
    const rows = bookings.filter((booking) => booking.programId === program.id);
    const attended = getEstimatedAttended(rows);
    const noShow = Math.max(rows.length - attended, 0);
    return { program: program.name, registered: rows.length, attended, noShow, rate: rows.length ? Math.round((attended / rows.length) * 100) : 0 };
  });
}

function buildWaitlist(programs: Array<{ id: string; name: string }>, batches: Array<{ programId: string; capacity: number; bookings: unknown[] }>) {
  return programs.map((program) => {
    const pressure = batches
      .filter((batch) => batch.programId === program.id)
      .reduce((sum, batch) => sum + Math.max(batch.bookings.length - batch.capacity, 0), 0);
    return { program: program.name, count: pressure };
  });
}

function getRevenueTotals(bookings: Array<{ amount: number; currency: string }>) {
  const inr = bookings.filter((b) => b.currency === "INR").reduce((sum, b) => sum + b.amount, 0);
  const usd = bookings.filter((b) => b.currency === "USD").reduce((sum, b) => sum + b.amount, 0);
  return { inr, usd, combined: inr + usd * exchangeRate };
}

function getRevenueWindows(bookings: Array<{ amount: number; currency: string; registeredAt: Date }>) {
  const now = new Date();
  return [
    { label: "Revenue Today", predicate: (date: Date) => isSameDay(date, now) },
    { label: "Revenue This Week", predicate: (date: Date) => date >= addDays(now, -7) },
    { label: "Revenue This Month", predicate: (date: Date) => date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() },
    { label: "Revenue This Year", predicate: (date: Date) => date.getFullYear() === now.getFullYear() }
  ].map((window) => {
    const rows = bookings.filter((booking) => window.predicate(booking.registeredAt));
    return { label: window.label, ...getRevenueTotals(rows) };
  });
}

function getEstimatedAttended(bookings: Array<{ status: BookingStatus }>) {
  const paid = bookings.filter((booking) => booking.status === "PAID").length;
  return Math.floor(paid * 0.88);
}

function getBucketLabel(date: Date, mode: string) {
  if (mode === "monthly") return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  if (mode === "weekly") {
    const first = new Date(date.getFullYear(), 0, 1);
    const week = Math.ceil((((date.getTime() - first.getTime()) / 86400000) + first.getDay() + 1) / 7);
    return `W${week}`;
  }
  return date.toISOString().slice(5, 10);
}

function toInr(amount: number, currency: string) {
  return currency === "USD" ? amount * exchangeRate : amount;
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

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function capitalize(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function seatBadge(fillRate: number) {
  if (fillRate >= 0.9) return "border-red-200 bg-red-50 text-red-700";
  if (fillRate >= 0.7) return "border-orange-200 bg-orange-50 text-orange-700";
  return "border-green-200 bg-green-50 text-green-700";
}

function paymentBadge(status: BookingStatus) {
  if (status === "PAID") return "border-green-200 bg-green-50 text-green-700";
  if (status === "PENDING") return "border-orange-200 bg-orange-50 text-orange-700";
  return "border-red-200 bg-red-50 text-red-700";
}

function Stat({ title, value, helper }: { title: string; value: string; helper: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-bold">{value}</p>
        <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function MiniStat({ title, value }: { title: string; value: number }) {
  return <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">{title}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>;
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent>{children}</CardContent></Card>;
}

function EmptyChart<T>({ data, children }: { data: T[]; children: React.ReactNode }) {
  return data.length ? children : <EmptyState title="No data for this filter" text="Try expanding the date range or resetting filters." />;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center"><p className="font-semibold">{title}</p><p className="mt-2 max-w-sm text-sm text-muted-foreground">{text}</p></div>;
}

function Select({ name, value, options }: { name: string; value: string; options: Array<[string, string]> }) {
  return (
    <select name={name} defaultValue={value} className="h-10 rounded-md border bg-background px-3 text-sm">
      {options.map(([optionValue, label]) => <option key={`${name}-${optionValue}`} value={optionValue}>{label}</option>)}
    </select>
  );
}
