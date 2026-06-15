import type React from "react";
import { ProgramType } from "@prisma/client";
import { BookOpen, PlusCircle, Users, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProgramBarChart } from "./program-charts";
import { ProgramCards } from "./program-cards";
import { saveProgram } from "./actions";

function programKey(programId: string, key: string) {
  return `program_${programId}_${key}`;
}

export default async function ProgramsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const [programsRaw, configs] = await Promise.all([
    prisma.program.findMany({
      include: { batches: { include: { bookings: true } }, bookings: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.systemConfig.findMany({ where: { group: "program" } })
  ]);
  const config = Object.fromEntries(configs.map((item) => [item.key, item.value]));
  const allBookings = programsRaw.flatMap((program) => program.bookings);
  const totalRevenue = allBookings.filter((booking) => booking.status === "PAID").reduce((sum, booking) => sum + (booking.currency === "USD" ? booking.amount * 83 : booking.amount), 0);

  const programs = programsRaw.map((program) => {
    const status = config[programKey(program.id, "status")] ?? (program.active ? "Active" : "Draft");
    const paid = program.bookings.filter((booking) => booking.status === "PAID");
    const attended = program.bookings.filter((booking) => booking.attendanceStatus === "ATTENDED").length;
    const completed = program.bookings.filter((booking) => booking.attendanceStatus === "ATTENDED" && booking.status === "PAID").length;
    const revenue = paid.reduce((sum, booking) => sum + (booking.currency === "USD" ? booking.amount * 83 : booking.amount), 0);
    const countryDistribution = Array.from(new Set(program.bookings.map((booking) => booking.country)))
      .map((country) => ({ name: country, value: program.bookings.filter((booking) => booking.country === country).length }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    return {
      id: program.id,
      name: program.name,
      slug: program.slug,
      type: config[programKey(program.id, "typeLabel")] ?? program.type,
      description: program.description,
      duration: program.duration ?? "",
      difficulty: config[programKey(program.id, "difficulty")] ?? "Beginner",
      status,
      indiaPrice: program.priceIndia,
      internationalPrice: program.priceGlobal,
      currencyIndia: program.currencyIndia,
      currencyGlobal: program.currencyGlobal,
      pricingEnabled: config[programKey(program.id, "pricingEnabled")] !== "false",
      freeProgram: config[programKey(program.id, "freeProgram")] === "true",
      razorpay: config[programKey(program.id, "razorpay")] !== "false",
      paypal: config[programKey(program.id, "paypal")] !== "false",
      activeBatches: program.batches.filter((batch) => batch.active).length,
      enrollmentsCount: program.bookings.length,
      paidCount: paid.length,
      revenue,
      attendanceRate: program.bookings.length ? Math.round((attended / program.bookings.length) * 100) : 0,
      completionRate: program.bookings.length ? Math.round((completed / program.bookings.length) * 100) : 0,
      batches: program.batches.map((batch) => ({
        id: batch.id,
        name: batch.id.slice(0, 8),
        date: batch.startsAt.toISOString(),
        timezone: "Asia/Kolkata",
        capacity: batch.capacity,
        registered: batch.bookings.length,
        available: Math.max(batch.capacity - batch.bookings.length, 0),
        status: batch.active ? "Active" : "Draft"
      })),
      enrollments: program.bookings.map((booking) => ({
        id: booking.id,
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        country: booking.country,
        batch: booking.batchId?.slice(0, 8) ?? "Unassigned",
        paymentStatus: booking.status,
        attendanceStatus: booking.attendanceStatus.replace("_", " "),
        registeredAt: booking.registeredAt.toISOString()
      })),
      countryDistribution,
      content: {
        coverImage: config[programKey(program.id, "coverImage")] ?? "",
        bannerImage: config[programKey(program.id, "bannerImage")] ?? "",
        heroTitle: config[programKey(program.id, "heroTitle")] ?? program.name,
        heroSubtitle: config[programKey(program.id, "heroSubtitle")] ?? program.description,
        overview: config[programKey(program.id, "overview")] ?? program.description,
        benefits: config[programKey(program.id, "benefits")] ?? "",
        whoShouldJoin: config[programKey(program.id, "whoShouldJoin")] ?? "",
        whatYouWillLearn: config[programKey(program.id, "whatYouWillLearn")] ?? "",
        faq: config[programKey(program.id, "faq")] ?? "",
        cta: config[programKey(program.id, "cta")] ?? "Register Now",
        testimonials: config[programKey(program.id, "testimonials")] ?? "",
        metaTitle: config[programKey(program.id, "metaTitle")] ?? program.name,
        metaDescription: config[programKey(program.id, "metaDescription")] ?? program.description,
        keywords: config[programKey(program.id, "keywords")] ?? "",
        openGraphImage: config[programKey(program.id, "openGraphImage")] ?? "",
        canonicalUrl: config[programKey(program.id, "canonicalUrl")] ?? "",
        registrationEmail: config[programKey(program.id, "registrationEmail")] ?? "",
        paymentEmail: config[programKey(program.id, "paymentEmail")] ?? "",
        reminderEmail: config[programKey(program.id, "reminderEmail")] ?? "",
        followUpEmail: config[programKey(program.id, "followUpEmail")] ?? "",
        completionEmail: config[programKey(program.id, "completionEmail")] ?? ""
      }
    };
  }).filter((program) => !params.status || params.status === "ALL" || program.status === params.status);

  const analytics = programs.map((program) => ({
    name: program.name.replace(" Meditation", ""),
    registrations: program.enrollmentsCount,
    revenue: program.revenue
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Program Management</p>
          <h1 className="font-serif text-4xl font-bold">Programs</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage programs, pricing, landing content, batches, enrollments, testimonials, SEO, and email automation.</p>
        </div>
        <Button asChild variant="accent"><a href="#create-program"><PlusCircle className="h-4 w-4" /> Create Program</a></Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={<BookOpen className="h-5 w-5" />} title="Total Programs" value={programsRaw.length.toString()} />
        <Stat icon={<BookOpen className="h-5 w-5" />} title="Active Programs" value={programsRaw.filter((program) => (config[programKey(program.id, "status")] ?? (program.active ? "Active" : "Draft")) === "Active").length.toString()} />
        <Stat icon={<Users className="h-5 w-5" />} title="Total Enrollments" value={allBookings.length.toString()} />
        <Stat icon={<Wallet className="h-5 w-5" />} title="Total Revenue" value={formatCurrency(totalRevenue, "INR")} />
      </div>

      <div className="flex flex-wrap gap-2">
        {["ALL", "Draft", "Active", "Closed", "Archived"].map((status) => (
          <Button key={status} asChild size="sm" variant={(params.status ?? "ALL") === status ? "accent" : "outline"}>
            <a href={status === "ALL" ? "/admin/programs" : `/admin/programs?status=${status}`}>{status === "ALL" ? "All" : status}</a>
          </Button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <Card id="create-program">
          <CardHeader>
            <CardTitle>Create Program</CardTitle>
            <CardDescription>Supports standard iChaitanya programs and future custom programs.</CardDescription>
          </CardHeader>
          <CardContent><ProgramForm /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Program Performance</CardTitle>
            <CardDescription>Registrations and revenue across programs.</CardDescription>
          </CardHeader>
          <CardContent><ProgramBarChart data={analytics} /></CardContent>
        </Card>
      </div>

      <ProgramCards programs={programs} />
    </div>
  );
}

function ProgramForm() {
  return (
    <form action={saveProgram} className="grid gap-3 md:grid-cols-2">
      <Input name="name" placeholder="Program Name" required />
      <Input name="slug" placeholder="Slug" required />
      <select name="type" className="h-10 rounded-md border bg-background px-3 text-sm">
        <option value="ORIENTATION">Orientation</option>
        <option value="BLISS_PATH">Bliss Path</option>
        <option value="AURA_NIGHT">Aura Night</option>
        <option value="ONE_TO_ONE">One-to-One Meditation</option>
        <option value="OPEN_EYE">Open Eye Meditation</option>
        <option value="WALKING">Walking Meditation</option>
        <option value="HABIT_DEADDICTION">Habit De-addiction Meditation</option>
        <option value="CUSTOM">Custom Program</option>
      </select>
      <Input name="customType" placeholder="Custom program type" />
      <Input name="duration" placeholder="Duration" />
      <Input name="difficulty" placeholder="Difficulty Level" defaultValue="Beginner" />
      <Input name="coverImage" placeholder="Cover Image URL" />
      <Input name="bannerImage" placeholder="Banner Image URL" />
      <Input name="indiaPrice" type="number" placeholder="India Price (INR)" />
      <Input name="internationalPrice" type="number" placeholder="International Price (USD)" />
      <Textarea name="shortDescription" className="md:col-span-2" placeholder="Short Description" required />
      <Textarea name="description" className="md:col-span-2" placeholder="Full Description" />
      <div className="grid gap-2 text-sm md:col-span-2 md:grid-cols-4">
        <label><input type="checkbox" name="pricingEnabled" defaultChecked /> Pricing Enabled</label>
        <label><input type="checkbox" name="freeProgram" /> Free Program</label>
        <label><input type="checkbox" name="razorpay" defaultChecked /> Razorpay</label>
        <label><input type="checkbox" name="paypal" defaultChecked /> PayPal</label>
      </div>
      <select name="status" defaultValue="Draft" className="h-10 rounded-md border bg-background px-3 text-sm"><option>Draft</option><option>Active</option><option>Closed</option><option>Archived</option></select>
      <Button type="submit" variant="accent">Create Program</Button>
    </form>
  );
}

function Stat({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return <Card><CardContent className="p-5"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 text-accent">{icon}</div><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-2xl font-bold">{value}</p></CardContent></Card>;
}
