import { BookingStatus } from "@prisma/client";
import type React from "react";
import { CalendarPlus, DollarSign, Users, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AttendanceTrendChart, OrientationCountryChart, OrientationLineChart } from "./orientation-charts";
import { createOrientationSlot, updateOrientationPricing } from "./actions";
import { OrientationSlots } from "./orientation-slots";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function slotKey(batchId: string, key: string) {
  return `orientation_slot_${batchId}_${key}`;
}

export default async function OrientationSettingsPage() {
  const { orientation, configs, slots } = await getOrientationData();
  const config = Object.fromEntries(configs.map((item) => [item.key, item.value]));
  const bookings = slots.flatMap((slot) => slot.bookings);
  const paidBookings = bookings.filter((booking) => booking.status === "PAID");
  const totalRevenue = paidBookings.reduce((sum, booking) => sum + (booking.currency === "USD" ? booking.amount * 83 : booking.amount), 0);
  const availableSeats = slots.reduce((sum, slot) => sum + Math.max(slot.capacity - slot.bookings.length, 0), 0);
  const activeSlots = slots.filter((slot) => (config[slotKey(slot.id, "status")] ?? (slot.active ? "Active" : "Draft")) === "Active").length;

  const serializedSlots = slots.map((slot) => {
    const status = config[slotKey(slot.id, "status")] ?? (slot.active ? "Active" : "Draft");
    const paid = slot.bookings.filter((booking) => booking.status === "PAID").length;
    const pending = slot.bookings.filter((booking) => booking.status === "PENDING").length;
    const attendanceCount = slot.bookings.filter((booking) => booking.attendanceStatus === "ATTENDED").length;
    const noShowCount = slot.bookings.filter((booking) => booking.attendanceStatus === "NO_SHOW").length;
    const waitlistCount = Math.max(slot.bookings.length - slot.capacity, 0);
    return {
      id: slot.id,
      date: slot.startsAt.toISOString(),
      endTime: config[slotKey(slot.id, "endTime")] ?? "",
      timezone: config[slotKey(slot.id, "timezone")] ?? "Asia/Kolkata",
      status,
      seatCap: slot.capacity,
      zoomLink: slot.zoomLink ?? "",
      zoomMeetingId: config[slotKey(slot.id, "zoomMeetingId")] ?? "",
      zoomPassword: config[slotKey(slot.id, "zoomPassword")] ?? "",
      registered: slot.bookings.length,
      paid,
      pending,
      attendanceCount,
      noShowCount,
      waitlistCount,
      registrations: slot.bookings.map((booking) => ({
        id: booking.id,
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        country: booking.country,
        paymentStatus: booking.status,
        attendanceStatus: booking.attendanceStatus,
        amount: booking.amount,
        currency: booking.currency
      })),
      automations: {
        autoConfirmation: config[slotKey(slot.id, "autoConfirmation")] !== "false",
        reminder24h: config[slotKey(slot.id, "reminder24h")] !== "false",
        reminder1h: config[slotKey(slot.id, "reminder1h")] !== "false",
        followUp: config[slotKey(slot.id, "followUp")] !== "false"
      }
    };
  });

  const batchOptions = slots.map((slot) => ({
    id: slot.id,
    label: `${slot.startsAt.toLocaleDateString("en-IN")} ${slot.startsAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
    available: Math.max(slot.capacity - slot.bookings.length, 0)
  }));

  const registrationTrend = buildDailyTrend(bookings.map((booking) => booking.registeredAt), 30);
  const revenueTrend = buildRevenueTrend(paidBookings);
  const attendanceTrend = serializedSlots.slice(-8).map((slot) => ({
    label: new Date(slot.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    attended: slot.attendanceCount,
    noShow: slot.noShowCount
  }));
  const countryDistribution = Array.from(new Set(bookings.map((booking) => booking.country)))
    .map((country) => ({ name: country, value: bookings.filter((booking) => booking.country === country).length }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">Orientation & Session Management</p>
        <h1 className="font-serif text-4xl font-bold">Orientation Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage orientation slots, pricing, Zoom metadata, registrations, attendance, reminders, calendar files, and capacity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Stat icon={<CalendarPlus className="h-5 w-5" />} title="Total Slots" value={slots.length.toString()} />
        <Stat icon={<CalendarPlus className="h-5 w-5" />} title="Active Slots" value={activeSlots.toString()} />
        <Stat icon={<Users className="h-5 w-5" />} title="Total Registrations" value={bookings.length.toString()} />
        <Stat icon={<Users className="h-5 w-5" />} title="Available Seats" value={availableSeats.toString()} />
        <Stat icon={<Wallet className="h-5 w-5" />} title="Revenue Generated" value={formatCurrency(totalRevenue, "INR")} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pricing Configuration</CardTitle>
            <CardDescription>Update orientation pricing without code changes.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateOrientationPricing} className="grid gap-4">
              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-2 font-semibold"><DollarSign className="h-4 w-4 text-accent" /> Indian Orientation</div>
                <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                  <Input name="indiaPrice" type="number" defaultValue={orientation?.priceIndia ?? 199} placeholder="Price (INR)" />
                  <Input name="indiaCurrency" defaultValue={orientation?.currencyIndia ?? "INR"} />
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" name="razorpayEnabled" defaultChecked={config.orientation_razorpay_enabled !== "false"} /> Razorpay Enabled</label>
              </div>
              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-2 font-semibold"><DollarSign className="h-4 w-4 text-accent" /> International Orientation</div>
                <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                  <Input name="internationalPrice" type="number" defaultValue={orientation?.priceGlobal ?? 30} placeholder="Price (USD)" />
                  <Input name="internationalCurrency" defaultValue={orientation?.currencyGlobal ?? "USD"} />
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" name="paypalEnabled" defaultChecked={config.orientation_paypal_enabled !== "false"} /> PayPal Enabled</label>
              </div>
              <Button variant="accent">Save Pricing</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generate Orientation Slot</CardTitle>
            <CardDescription>Create a new date, capacity, Zoom setup, and operational status.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createOrientationSlot} className="grid gap-3 md:grid-cols-2">
              <Input name="date" type="date" required />
              <Input name="timezone" defaultValue="Asia/Kolkata" placeholder="Timezone" />
              <Input name="startTime" type="time" required />
              <Input name="endTime" type="time" required />
              <Input name="seatCap" type="number" defaultValue={100} placeholder="Seat Capacity" />
              <select name="status" defaultValue="Draft" className="h-10 rounded-md border bg-background px-3 text-sm">
                <option>Draft</option><option>Active</option><option>Full</option><option>Cancelled</option><option>Completed</option>
              </select>
              <select name="zoomMode" defaultValue="manual" className="h-10 rounded-md border bg-background px-3 text-sm md:col-span-2">
                <option value="manual">Manual Zoom Link</option>
                <option value="auto">Auto Generate Zoom Meeting</option>
              </select>
              <Input name="zoomLink" placeholder="Meeting Link" />
              <Input name="zoomMeetingId" placeholder="Meeting ID" />
              <Input name="zoomPassword" placeholder="Meeting Password" className="md:col-span-2" />
              <Button variant="accent" className="md:col-span-2">Generate Slot</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <OrientationSlots slots={serializedSlots} batchOptions={batchOptions} />

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Registrations Trend"><OrientationLineChart data={registrationTrend} /></ChartCard>
        <ChartCard title="Revenue Trend"><OrientationLineChart data={revenueTrend} color="#2B1712" /></ChartCard>
        <ChartCard title="Attendance Trend"><AttendanceTrendChart data={attendanceTrend} /></ChartCard>
        <ChartCard title="Country Distribution">{countryDistribution.length ? <OrientationCountryChart data={countryDistribution} /> : <EmptyChart />}</ChartCard>
      </div>
    </div>
  );
}

async function getOrientationData() {
  try {
    const orientation = await prisma.program.findUnique({ where: { slug: "orientation" } });
    const [configs, slots] = await Promise.all([
      prisma.systemConfig.findMany({ where: { group: "orientation" } }),
      prisma.batch.findMany({
        where: orientation ? { programId: orientation.id } : { id: "__none__" },
        include: { bookings: { include: { payment: true } } },
        orderBy: { startsAt: "asc" }
      })
    ]);
    return { orientation, configs, slots };
  } catch (error) {
    console.warn("Orientation database unavailable; rendering empty session view.", error);
    return { orientation: null, configs: [], slots: [] };
  }
}

function Stat({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return <Card><CardContent className="p-5"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 text-accent">{icon}</div><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-2xl font-bold">{value}</p></CardContent></Card>;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{children}</CardContent></Card>;
}

function EmptyChart() {
  return <div className="flex h-[230px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">No data yet</div>;
}

function buildDailyTrend(dates: Date[], days: number) {
  return Array.from({ length: days }).map((_, index) => {
    const date = addDays(new Date(), -(days - 1 - index));
    const key = date.toISOString().slice(5, 10);
    return { label: key, value: dates.filter((item) => item.toISOString().slice(5, 10) === key).length };
  });
}

function buildRevenueTrend(bookings: Array<{ registeredAt: Date; amount: number; currency: string; status: BookingStatus }>) {
  return Array.from({ length: 30 }).map((_, index) => {
    const date = addDays(new Date(), -(29 - index));
    const key = date.toISOString().slice(5, 10);
    const value = bookings
      .filter((booking) => booking.registeredAt.toISOString().slice(5, 10) === key)
      .reduce((sum, booking) => sum + (booking.currency === "USD" ? booking.amount * 83 : booking.amount), 0);
    return { label: key, value };
  });
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
