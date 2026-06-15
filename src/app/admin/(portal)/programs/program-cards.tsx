"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, Copy, Eye, FileDown, Mail, Pencil, PlusCircle, Settings, Trash2, Users } from "lucide-react";
import { BookingStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CountryPie } from "./program-charts";
import { createProgramBatch, deleteProgram, duplicateProgram, saveProgram, saveProgramContent, setProgramStatus } from "./actions";

type Enrollment = {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  batch: string;
  paymentStatus: BookingStatus;
  attendanceStatus: string;
  registeredAt: string;
};

type Batch = {
  id: string;
  name: string;
  date: string;
  timezone: string;
  capacity: number;
  registered: number;
  available: number;
  status: string;
};

type ProgramCardData = {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  duration: string;
  difficulty: string;
  status: string;
  indiaPrice: number;
  internationalPrice: number;
  currencyIndia: string;
  currencyGlobal: string;
  pricingEnabled: boolean;
  freeProgram: boolean;
  razorpay: boolean;
  paypal: boolean;
  activeBatches: number;
  enrollmentsCount: number;
  paidCount: number;
  revenue: number;
  attendanceRate: number;
  completionRate: number;
  batches: Batch[];
  enrollments: Enrollment[];
  countryDistribution: { name: string; value: number }[];
  content: Record<string, string>;
};

export function ProgramCards({ programs }: { programs: ProgramCardData[] }) {
  const [open, setOpen] = useState<string | null>(programs[0]?.id ?? null);

  return (
    <div className="grid gap-4">
      {programs.map((program) => (
        <Card key={program.id}>
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <button className="text-left" onClick={() => setOpen(open === program.id ? null : program.id)}>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-serif text-2xl font-bold">{program.name}</h2>
                  <Badge className={statusBadge(program.status)}>{program.status}</Badge>
                  <Badge>{program.type}</Badge>
                </div>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{program.description}</p>
                <p className="mt-3 text-sm">
                  {program.freeProgram || !program.pricingEnabled ? "Free / Pricing disabled" : `${formatCurrency(program.indiaPrice, "INR")} / ${formatCurrency(program.internationalPrice, "USD")}`} • {program.enrollmentsCount} enrollments • {program.activeBatches} active batches • {formatCurrency(program.revenue, "INR")} revenue
                </p>
              </button>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline"><Link href={`/programs/${program.slug}`}><Eye className="h-4 w-4" /> View Program</Link></Button>
                <Button asChild size="sm" variant="outline"><Link href={`/programs/${program.slug}`} target="_blank">Preview Landing Page</Link></Button>
                <form action={duplicateProgram.bind(null, program.id)}><Button size="sm" variant="outline"><Copy className="h-4 w-4" /> Duplicate</Button></form>
                <form action={setProgramStatus.bind(null, program.id, "Archived")}><Button size="sm" variant="outline"><Archive className="h-4 w-4" /> Archive</Button></form>
                <form action={deleteProgram.bind(null, program.id)}><Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /> Delete</Button></form>
              </div>
            </div>

            {open === program.id ? (
              <div className="space-y-6 border-t pt-5">
                <div className="grid gap-3 md:grid-cols-5">
                  <Mini label="Registrations" value={program.enrollmentsCount.toString()} />
                  <Mini label="Paid" value={program.paidCount.toString()} />
                  <Mini label="Revenue" value={formatCurrency(program.revenue, "INR")} />
                  <Mini label="Attendance" value={`${program.attendanceRate}%`} />
                  <Mini label="Completion" value={`${program.completionRate}%`} />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
                  <section className="rounded-lg border p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-semibold">Overview & Pricing</h3>
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <form action={saveProgram} className="grid gap-3 md:grid-cols-2">
                      <input type="hidden" name="id" value={program.id} />
                      <Input name="name" defaultValue={program.name} />
                      <Input name="slug" defaultValue={program.slug} />
                      <Select name="type" value={program.type} />
                      <Input name="customType" placeholder="Future custom type" />
                      <Input name="duration" defaultValue={program.duration} placeholder="Duration" />
                      <Input name="difficulty" defaultValue={program.difficulty} placeholder="Difficulty" />
                      <Input name="indiaPrice" type="number" defaultValue={program.indiaPrice} placeholder="India Price" />
                      <Input name="internationalPrice" type="number" defaultValue={program.internationalPrice} placeholder="International Price" />
                      <Input name="coverImage" defaultValue={program.content.coverImage ?? ""} placeholder="Cover Image URL" />
                      <Input name="bannerImage" defaultValue={program.content.bannerImage ?? ""} placeholder="Banner Image URL" />
                      <Textarea name="shortDescription" defaultValue={program.description} className="md:col-span-2" />
                      <div className="grid gap-2 text-sm md:col-span-2 md:grid-cols-4">
                        <label><input type="checkbox" name="pricingEnabled" defaultChecked={program.pricingEnabled} /> Pricing Enabled</label>
                        <label><input type="checkbox" name="freeProgram" defaultChecked={program.freeProgram} /> Free Program</label>
                        <label><input type="checkbox" name="razorpay" defaultChecked={program.razorpay} /> Razorpay</label>
                        <label><input type="checkbox" name="paypal" defaultChecked={program.paypal} /> PayPal</label>
                      </div>
                      <SelectStatus value={program.status} />
                      <Button variant="accent"><Pencil className="h-4 w-4" /> Save Program</Button>
                    </form>
                  </section>

                  <section className="rounded-lg border p-4">
                    <h3 className="mb-3 font-semibold">Program Analytics</h3>
                    {program.countryDistribution.length ? <CountryPie data={program.countryDistribution} /> : <EmptySmall text="No country data yet" />}
                  </section>
                </div>

                <section className="rounded-lg border p-4">
                  <h3 className="mb-4 font-semibold">Program Content Management</h3>
                  <form action={saveProgramContent} className="grid gap-3 md:grid-cols-2">
                    <input type="hidden" name="programId" value={program.id} />
                    <Input name="heroTitle" defaultValue={program.content.heroTitle ?? ""} placeholder="Hero Title" />
                    <Input name="heroSubtitle" defaultValue={program.content.heroSubtitle ?? ""} placeholder="Hero Subtitle" />
                    <Textarea name="overview" defaultValue={program.content.overview ?? ""} placeholder="Program Overview" />
                    <Textarea name="benefits" defaultValue={program.content.benefits ?? ""} placeholder="Benefits" />
                    <Textarea name="whoShouldJoin" defaultValue={program.content.whoShouldJoin ?? ""} placeholder="Who Should Join" />
                    <Textarea name="whatYouWillLearn" defaultValue={program.content.whatYouWillLearn ?? ""} placeholder="What You Will Learn" />
                    <Textarea name="faq" defaultValue={program.content.faq ?? ""} placeholder="FAQs" />
                    <Textarea name="testimonials" defaultValue={program.content.testimonials ?? ""} placeholder="Testimonials / stories / screenshots notes" />
                    <Input name="cta" defaultValue={program.content.cta ?? ""} placeholder="Call To Action" />
                    <Input name="metaTitle" defaultValue={program.content.metaTitle ?? ""} placeholder="Meta Title" />
                    <Input name="metaDescription" defaultValue={program.content.metaDescription ?? ""} placeholder="Meta Description" />
                    <Input name="keywords" defaultValue={program.content.keywords ?? ""} placeholder="Keywords" />
                    <Input name="openGraphImage" defaultValue={program.content.openGraphImage ?? ""} placeholder="Open Graph Image" />
                    <Input name="canonicalUrl" defaultValue={program.content.canonicalUrl ?? ""} placeholder="Canonical URL" />
                    <Input name="registrationEmail" defaultValue={program.content.registrationEmail ?? ""} placeholder="Registration Email Template" />
                    <Input name="paymentEmail" defaultValue={program.content.paymentEmail ?? ""} placeholder="Payment Confirmation Template" />
                    <Input name="reminderEmail" defaultValue={program.content.reminderEmail ?? ""} placeholder="Reminder Email Template" />
                    <Input name="followUpEmail" defaultValue={program.content.followUpEmail ?? ""} placeholder="Follow-up Email Template" />
                    <Input name="completionEmail" defaultValue={program.content.completionEmail ?? ""} placeholder="Completion Email Template" />
                    <Button variant="accent" className="md:col-span-2">Save Content, SEO & Automation</Button>
                  </form>
                </section>

                <section className="rounded-lg border p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">Batch Management</h3>
                    <Button size="sm" variant="outline"><PlusCircle className="h-4 w-4" /> Create Batch</Button>
                  </div>
                  <form action={createProgramBatch} className="mb-4 grid gap-3 md:grid-cols-6">
                    <input type="hidden" name="programId" value={program.id} />
                    <Input name="date" type="date" required />
                    <Input name="time" type="time" required />
                    <Input name="timezone" defaultValue="Asia/Kolkata" />
                    <Input name="capacity" type="number" defaultValue={30} />
                    <Input name="zoomLink" placeholder="Zoom link" />
                    <Button variant="accent">Create Batch</Button>
                  </form>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Batch Name</TableHead><TableHead>Date</TableHead><TableHead>Timezone</TableHead><TableHead>Capacity</TableHead><TableHead>Registered</TableHead><TableHead>Available</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {program.batches.map((batch) => (
                          <TableRow key={batch.id}><TableCell>{batch.name}</TableCell><TableCell>{formatDate(batch.date)}</TableCell><TableCell>{batch.timezone}</TableCell><TableCell>{batch.capacity}</TableCell><TableCell>{batch.registered}</TableCell><TableCell>{batch.available}</TableCell><TableCell><Badge>{batch.status}</Badge></TableCell><TableCell><Button size="sm" variant="outline"><FileDown className="h-4 w-4" /> Export</Button></TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </section>

                <section className="rounded-lg border p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">Enrollments</h3>
                    <Button size="sm" variant="outline"><Users className="h-4 w-4" /> View Enrollments</Button>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Country</TableHead><TableHead>Batch</TableHead><TableHead>Payment</TableHead><TableHead>Attendance</TableHead><TableHead>Registration Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {program.enrollments.slice(0, 8).map((enrollment) => (
                          <TableRow key={enrollment.id}><TableCell>{enrollment.name}</TableCell><TableCell>{enrollment.email}</TableCell><TableCell>{enrollment.phone}</TableCell><TableCell>{enrollment.country}</TableCell><TableCell>{enrollment.batch}</TableCell><TableCell><Badge>{enrollment.paymentStatus}</Badge></TableCell><TableCell>{enrollment.attendanceStatus}</TableCell><TableCell>{formatDate(enrollment.registeredAt)}</TableCell><TableCell><div className="flex gap-1"><Button size="sm" variant="outline">View</Button><Button size="sm" variant="outline">Refund</Button><Button size="sm" variant="outline"><Mail className="h-4 w-4" /></Button></div></TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>;
}

function Select({ name, value }: { name: string; value: string }) {
  const options = [
    ["ORIENTATION", "Orientation"],
    ["BLISS_PATH", "Bliss Path"],
    ["AURA_NIGHT", "Aura Night"],
    ["ONE_TO_ONE", "One-to-One Meditation"],
    ["OPEN_EYE", "Open Eye Meditation"],
    ["WALKING", "Walking Meditation"],
    ["HABIT_DEADDICTION", "Habit De-addiction Meditation"],
    ["CUSTOM", "Custom Program"]
  ];
  return <select name={name} defaultValue={value} className="h-10 rounded-md border bg-background px-3 text-sm">{options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}</select>;
}

function SelectStatus({ value }: { value: string }) {
  return <select name="status" defaultValue={value} className="h-10 rounded-md border bg-background px-3 text-sm"><option>Draft</option><option>Active</option><option>Closed</option><option>Archived</option></select>;
}

function statusBadge(status: string) {
  if (status === "Active") return "border-green-200 bg-green-50 text-green-700";
  if (status === "Closed") return "border-orange-200 bg-orange-50 text-orange-700";
  if (status === "Archived") return "border-gray-200 bg-gray-50 text-gray-700";
  return "border-stone-200 bg-stone-50 text-stone-700";
}

function EmptySmall({ text }: { text: string }) {
  return <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">{text}</div>;
}
