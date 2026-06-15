import type React from "react";
import Link from "next/link";
import { CalendarClock, Download, Eye, Mail, MessageCircle, MoonStar, Send, Trophy, Users, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AuraCountryPie, AuraLineChart, AuraRetentionChart } from "./aura-charts";
import { cancelAuraEnrollment, markAuraAttendance, saveAuraAutomation, saveAuraLanding, saveAuraSettings } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function auraKey(key: string) {
  return `aura_night_${key}`;
}

export default async function AuraNightPage() {
  const aura = await prisma.program.findUnique({
    where: { slug: "aura-night" },
    include: { bookings: { include: { batch: true, payment: true } }, batches: true }
  });
  const configs = await prisma.systemConfig.findMany({ where: { group: "aura-night" } });
  const config = Object.fromEntries(configs.map((item) => [item.key, item.value]));
  const bookings = aura?.bookings ?? [];
  const paidBookings = bookings.filter((booking) => booking.status === "PAID");
  const activeParticipants = bookings.filter((booking) => booking.status !== "CANCELLED" && booking.status !== "REFUNDED");
  const sessionCount = Number(config[auraKey("sessionCount")] ?? 25);
  const revenue = paidBookings.reduce((sum, booking) => sum + (booking.currency === "USD" ? booking.amount * 83 : booking.amount), 0);
  const completedParticipants = activeParticipants.filter((booking) => getJourneyDay(booking.registeredAt, sessionCount) >= sessionCount && booking.attendanceStatus === "ATTENDED").length;
  const droppedParticipants = bookings.filter((booking) => booking.status === "CANCELLED" || booking.attendanceStatus === "NO_SHOW").length;
  const completionRate = activeParticipants.length ? Math.round((completedParticipants / activeParticipants.length) * 100) : 0;
  const currentJourneyCount = new Set(activeParticipants.map((booking) => booking.registeredAt.toISOString().slice(0, 10))).size;
  const status = config[auraKey("status")] ?? (aura?.active ? "Active" : "Draft");
  const startTime = config[auraKey("startTime")] ?? "21:00";
  const endTime = config[auraKey("endTime")] ?? "21:10";
  const timezone = config[auraKey("timezone")] ?? "Asia/Kolkata";
  const duration = aura?.duration ?? "10 min";

  const participants = activeParticipants.map((booking) => {
    const currentDay = getJourneyDay(booking.registeredAt, sessionCount);
    const attendedDays = estimateAttendedDays(booking.attendanceStatus, currentDay);
    const missedDays = Math.max(currentDay - attendedDays, 0);
    const attendancePercent = currentDay ? Math.round((attendedDays / currentDay) * 100) : 0;
    const completionPercent = Math.min(Math.round((currentDay / sessionCount) * 100), 100);
    return {
      id: booking.id,
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      country: booking.country,
      startDate: booking.registeredAt,
      currentDay,
      attendedDays,
      missedDays,
      attendancePercent,
      completionPercent,
      noShowPercent: currentDay ? Math.round((missedDays / currentDay) * 100) : 0,
      paymentStatus: booking.status,
      batchId: booking.batchId,
      amount: booking.amount,
      currency: booking.currency
    };
  });

  const newParticipants = participants.filter((participant) => participant.currentDay <= 3).length;
  const attendanceTrend = buildDailyTrend(bookings.filter((booking) => booking.attendanceStatus === "ATTENDED").map((booking) => booking.registeredAt), 14);
  const revenueTrend = buildRevenueTrend(paidBookings);
  const countryDistribution = Array.from(new Set(bookings.map((booking) => booking.country)))
    .map((country) => ({ name: country, value: bookings.filter((booking) => booking.country === country).length }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const retention = [
    { label: "New", active: newParticipants, completed: 0, dropped: 0 },
    { label: "Active", active: activeParticipants.length, completed: 0, dropped: 0 },
    { label: "Completed", active: 0, completed: completedParticipants, dropped: 0 },
    { label: "Dropped", active: 0, completed: 0, dropped: droppedParticipants }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Aura Night Management</p>
          <h1 className="font-serif text-4xl font-bold">Aura Night</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage recurring Aura Night meditation journeys, enrollments, attendance, reminders, and pricing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href="/aura-night"><Eye className="h-4 w-4" /> View Public Page</Link></Button>
          <Button asChild variant="outline"><Link href="/api/aura-night/participants"><Download className="h-4 w-4" /> Export Participants</Link></Button>
          <Button variant="accent"><Send className="h-4 w-4" /> Send Reminder</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Stat icon={<MoonStar className="h-5 w-5" />} title="Program Status" value={status} />
        <Stat icon={<Users className="h-5 w-5" />} title="Active Participants" value={activeParticipants.length.toString()} />
        <Stat icon={<Wallet className="h-5 w-5" />} title="Total Revenue" value={formatCurrency(revenue, "INR")} />
        <Stat icon={<CalendarClock className="h-5 w-5" />} title="Daily Session Time" value={`${startTime} - ${endTime}`} />
        <Stat icon={<Trophy className="h-5 w-5" />} title="Completion Rate" value={`${completionRate}%`} />
        <Stat icon={<MoonStar className="h-5 w-5" />} title="Current Journey Count" value={currentJourneyCount.toString()} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Program, Pricing, Session & Zoom Settings</CardTitle>
            <CardDescription>Configure Aura Night without code changes.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={saveAuraSettings} className="grid gap-4 md:grid-cols-2">
              <Input name="name" defaultValue={aura?.name ?? "Aura Night"} placeholder="Program Name" />
              <Input name="heroTitle" defaultValue={config[auraKey("heroTitle")] ?? "Aura Night Meditation"} placeholder="Hero Title" />
              <Textarea name="description" defaultValue={aura?.description ?? ""} className="md:col-span-2" placeholder="Description" />
              <select name="status" defaultValue={status} className="h-10 rounded-md border bg-background px-3 text-sm"><option>Draft</option><option>Active</option><option>Paused</option><option>Closed</option></select>
              <select name="programType" defaultValue={config[auraKey("programType")] ?? "Rolling Enrollment"} className="h-10 rounded-md border bg-background px-3 text-sm"><option>Rolling Enrollment</option><option>Fixed Batch</option></select>
              <Input name="indiaPrice" type="number" defaultValue={aura?.priceIndia ?? 75} placeholder="India Price" />
              <Input name="internationalPrice" type="number" defaultValue={aura?.priceGlobal ?? 10} placeholder="International Price" />
              <Input name="indiaCurrency" defaultValue={config[auraKey("indiaCurrency")] ?? "INR"} />
              <Input name="internationalCurrency" defaultValue={config[auraKey("internationalCurrency")] ?? "USD"} />
              <div className="grid gap-2 text-sm md:col-span-2 md:grid-cols-4">
                <Toggle name="razorpay" label="Enable Razorpay" checked={config[auraKey("razorpay")] !== "false"} />
                <Toggle name="paypal" label="Enable PayPal" checked={config[auraKey("paypal")] !== "false"} />
                <Toggle name="discountCodes" label="Discount Codes" checked={config[auraKey("discountCodes")] === "true"} />
                <Toggle name="couponCodes" label="Coupon Codes" checked={config[auraKey("couponCodes")] === "true"} />
              </div>
              <Input name="startTime" type="time" defaultValue={startTime} />
              <Input name="endTime" type="time" defaultValue={endTime} />
              <Input name="timezone" defaultValue={timezone} />
              <Input name="duration" defaultValue={duration} />
              <select name="sessionCount" defaultValue={String(sessionCount)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="25">25 Days</option><option value="29">29 Days</option><option value="40">40 Days</option></select>
              <select name="zoomMode" defaultValue={config[auraKey("zoomMode")] ?? "reuse"} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="reuse">Reuse Same Zoom Meeting</option><option value="daily">Generate Daily Zoom Meetings</option><option value="auto">Auto Generate Zoom Links</option></select>
              <Input name="zoomLink" defaultValue={aura?.zoomLink ?? ""} placeholder="Meeting Link" />
              <Input name="zoomMeetingId" defaultValue={config[auraKey("zoomMeetingId")] ?? ""} placeholder="Meeting ID" />
              <Input name="zoomPassword" defaultValue={config[auraKey("zoomPassword")] ?? ""} placeholder="Meeting Password" />
              <div className="grid gap-2 text-sm md:col-span-2 md:grid-cols-3">
                <Toggle name="reuseZoom" label="Reuse Same Zoom" checked={config[auraKey("reuseZoom")] !== "false"} />
                <Toggle name="generateDailyZoom" label="Generate Daily Zoom" checked={config[auraKey("generateDailyZoom")] === "true"} />
                <Toggle name="autoZoomLinks" label="Auto Zoom Links" checked={config[auraKey("autoZoomLinks")] === "true"} />
              </div>
              <Button variant="accent" className="md:col-span-2">Save Aura Night Settings</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automations, Certificates & Testimonial Collection</CardTitle>
            <CardDescription>Configure reminders, WhatsApp, email, certificates, and feedback requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={saveAuraAutomation} className="space-y-5">
              <SettingGroup title="Automated Reminders" items={[["dailyReminder", "Daily Reminder"], ["oneHourReminder", "1 Hour Reminder"], ["fifteenMinuteReminder", "15 Minute Reminder"], ["completionCongrats", "Completion Congratulations"]]} config={config} />
              <SettingGroup title="WhatsApp Automation" items={[["whatsappWelcome", "Welcome Message"], ["whatsappDaily", "Daily Reminder"], ["whatsappCompletion", "Completion Message"], ["whatsappMissed", "Missed Session Follow-up"]]} config={config} />
              <SettingGroup title="Email Automation" items={[["emailEnrollment", "Enrollment Confirmation"], ["emailZoom", "Zoom Link"], ["emailDaily", "Daily Reminder"], ["emailProgress", "Journey Progress"], ["emailCertificate", "Completion Certificate"]]} config={config} />
              <div className="rounded-lg border p-4">
                <p className="mb-3 font-semibold">Certificate Management</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input name="certificateMinAttendance" defaultValue={config[auraKey("certificateMinAttendance")] ?? "80"} placeholder="Minimum Attendance %" />
                  <Toggle name="autoCertificate" label="Send PDF Certificate Automatically" checked={config[auraKey("autoCertificate")] === "true"} />
                </div>
              </div>
              <SettingGroup title="Testimonial Collection" items={[["requestFeedback", "Request Feedback"], ["requestRating", "Request Rating"], ["requestVideo", "Request Video Testimonial"], ["requestWhatsappScreenshot", "Request WhatsApp Screenshot"]]} config={config} />
              <Button variant="accent">Save Automation Settings</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <Card>
          <CardHeader><CardTitle>Enrollment Management</CardTitle><CardDescription>Active participants and journey progress.</CardDescription></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Country</TableHead><TableHead>Journey Start</TableHead><TableHead>Current Day</TableHead><TableHead>Payment</TableHead><TableHead>Attendance</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {participants.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell className="font-medium">{participant.name}</TableCell>
                    <TableCell>{participant.email}</TableCell>
                    <TableCell>{participant.phone}</TableCell>
                    <TableCell>{participant.country}</TableCell>
                    <TableCell>{formatDate(participant.startDate)}</TableCell>
                    <TableCell>Day {participant.currentDay}</TableCell>
                    <TableCell><Badge>{participant.paymentStatus}</Badge></TableCell>
                    <TableCell>{participant.attendancePercent}%</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="outline">View</Button>
                        <Button size="sm" variant="outline"><Mail className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline"><MessageCircle className="h-4 w-4" /></Button>
                        <form action={markAuraAttendance.bind(null, participant.id, participant.batchId, "ATTENDED")}><Button size="sm" variant="outline">Attended</Button></form>
                        <form action={markAuraAttendance.bind(null, participant.id, participant.batchId, "NO_SHOW")}><Button size="sm" variant="outline">Missed</Button></form>
                        <form action={cancelAuraEnrollment.bind(null, participant.id)}><Button size="sm" variant="destructive">Cancel</Button></form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Participant Insights</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <Mini title="New Participants" value={newParticipants} />
            <Mini title="Active Participants" value={activeParticipants.length} />
            <Mini title="Completed Participants" value={completedParticipants} />
            <Mini title="Dropped Participants" value={droppedParticipants} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Journey Tracking</CardTitle><CardDescription>Day-by-day journey progress and attendance status.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          {participants.slice(0, 8).map((participant) => (
            <div key={participant.id} className="rounded-lg border p-4">
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div><p className="font-semibold">{participant.name}</p><p className="text-sm text-muted-foreground">Completed {participant.attendedDays} days • Missed {participant.missedDays} days • {participant.completionPercent}% progress</p></div>
                <Badge>{participant.attendancePercent}% attendance</Badge>
              </div>
              <div className="mb-3 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent" style={{ width: `${participant.completionPercent}%` }} /></div>
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: sessionCount }).map((_, index) => {
                  const day = index + 1;
                  const done = day <= participant.attendedDays;
                  const missed = day <= participant.currentDay && day > participant.attendedDays;
                  return <div key={day} title={`Journey Day ${day}`} className={`h-6 rounded text-center text-[10px] leading-6 ${done ? "bg-primary text-primary-foreground" : missed ? "bg-accent/70 text-primary" : "bg-muted text-muted-foreground"}`}>{day}</div>;
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Chart title="Daily Attendance Trend"><AuraLineChart data={attendanceTrend} /></Chart>
        <Chart title="Participant Retention"><AuraRetentionChart data={retention} /></Chart>
        <Chart title="Revenue Trend"><AuraLineChart data={revenueTrend} color="#2B1712" /></Chart>
        <Chart title="Country Distribution">{countryDistribution.length ? <AuraCountryPie data={countryDistribution} /> : <EmptyChart />}</Chart>
      </div>

      <Card>
        <CardHeader><CardTitle>Landing Page Management</CardTitle><CardDescription>Manage Aura Night public page content and SEO settings.</CardDescription></CardHeader>
        <CardContent>
          <form action={saveAuraLanding} className="grid gap-3 md:grid-cols-2">
            <Input name="landingHero" defaultValue={config[auraKey("landingHero")] ?? "Aura Night Meditation"} placeholder="Hero Section" />
            <Input name="landingCta" defaultValue={config[auraKey("landingCta")] ?? "Join Aura Night"} placeholder="CTA Text" />
            <Textarea name="landingDescription" defaultValue={config[auraKey("landingDescription")] ?? aura?.description ?? ""} placeholder="Description" />
            <Textarea name="landingBenefits" defaultValue={config[auraKey("landingBenefits")] ?? ""} placeholder="Benefits" />
            <Textarea name="landingFaqs" defaultValue={config[auraKey("landingFaqs")] ?? ""} placeholder="FAQs" />
            <Textarea name="landingTestimonials" defaultValue={config[auraKey("landingTestimonials")] ?? ""} placeholder="Testimonials" />
            <Input name="seoTitle" defaultValue={config[auraKey("seoTitle")] ?? "Aura Night - iChaitanya"} placeholder="SEO Title" />
            <Input name="seoDescription" defaultValue={config[auraKey("seoDescription")] ?? ""} placeholder="SEO Description" />
            <Input name="seoKeywords" defaultValue={config[auraKey("seoKeywords")] ?? ""} placeholder="SEO Keywords" className="md:col-span-2" />
            <Button variant="accent" className="md:col-span-2">Save Landing Page & SEO</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return <Card><CardContent className="p-5"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 text-accent">{icon}</div><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-xl font-bold">{value}</p></CardContent></Card>;
}

function Mini({ title, value }: { title: string; value: number }) {
  return <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">{title}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>;
}

function Chart({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{children}</CardContent></Card>;
}

function EmptyChart() {
  return <div className="flex h-[230px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">No data yet</div>;
}

function Toggle({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={name} defaultChecked={checked} /> {label}</label>;
}

function SettingGroup({ title, items, config }: { title: string; items: Array<[string, string]>; config: Record<string, string> }) {
  return <div className="rounded-lg border p-4"><p className="mb-3 font-semibold">{title}</p><div className="grid gap-2 md:grid-cols-2">{items.map(([key, label]) => <Toggle key={key} name={key} label={label} checked={config[auraKey(key)] === "true"} />)}</div></div>;
}

function getJourneyDay(startDate: Date, sessionCount: number) {
  const diff = Math.floor((Date.now() - startDate.getTime()) / 86400000) + 1;
  return Math.min(Math.max(diff, 1), sessionCount);
}

function estimateAttendedDays(status: string, currentDay: number) {
  if (status === "ATTENDED") return currentDay;
  if (status === "NO_SHOW") return Math.max(Math.floor(currentDay * 0.55), 0);
  return Math.max(Math.floor(currentDay * 0.82), 0);
}

function buildDailyTrend(dates: Date[], days: number) {
  return Array.from({ length: days }).map((_, index) => {
    const date = addDays(new Date(), -(days - 1 - index));
    const key = date.toISOString().slice(5, 10);
    return { label: key, value: dates.filter((item) => item.toISOString().slice(5, 10) === key).length };
  });
}

function buildRevenueTrend(bookings: Array<{ registeredAt: Date; amount: number; currency: string }>) {
  return Array.from({ length: 14 }).map((_, index) => {
    const date = addDays(new Date(), -(13 - index));
    const key = date.toISOString().slice(5, 10);
    const value = bookings.filter((booking) => booking.registeredAt.toISOString().slice(5, 10) === key).reduce((sum, booking) => sum + (booking.currency === "USD" ? booking.amount * 83 : booking.amount), 0);
    return { label: key, value };
  });
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
