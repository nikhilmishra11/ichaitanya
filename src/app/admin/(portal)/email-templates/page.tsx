import type React from "react";
import { Copy, Eye, Mail, Send, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { metadataMap } from "@/lib/admin-metadata";
import { AdminBarChart, AdminLineChart } from "@/components/admin-analytics-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { deleteEmailTemplate, duplicateEmailTemplate, saveEmailTemplate, setEmailTemplateStatus } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const variables = ["{{name}}", "{{email}}", "{{program}}", "{{batch}}", "{{session_date}}", "{{session_time}}", "{{zoom_link}}", "{{meeting_id}}", "{{meeting_password}}", "{{payment_amount}}", "{{booking_reference}}", "{{certificate_link}}"];
const categories = ["Orientation", "Programs", "Aura Night", "Testimonials", "System"];
const triggers = ["Booking Created", "Payment Successful", "Batch Assigned", "24 Hours Before Session", "1 Hour Before Session", "Aura Night Daily Reminder", "Program Completed", "Testimonial Request", "Manual Email"];
const meta = (id: string, field: string) => `email_template_${id}_${field}`;

export default async function EmailTemplatesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const params = await searchParams;
  const [templates, logs, configs] = await Promise.all([
    prisma.emailTemplate.findMany({ orderBy: { name: "asc" } }),
    prisma.emailLog.findMany({ include: { template: true }, orderBy: { sentAt: "desc" }, take: 30 }),
    prisma.systemConfig.findMany({ where: { group: "email-templates" } })
  ]);
  const config = metadataMap(configs);
  const enriched = templates.map((template) => ({
    ...template,
    category: config[meta(template.id, "category")] ?? "System",
    status: config[meta(template.id, "status")] ?? (template.active ? "Active" : "Draft"),
    trigger: config[meta(template.id, "trigger")] ?? "Manual Email",
    language: config[meta(template.id, "language")] ?? "English",
    usage: logs.filter((log) => log.templateId === template.id).length
  })).filter((template) => !params.category || params.category === "ALL" || template.category === params.category);
  const sentToday = logs.filter((log) => sameDay(log.sentAt, new Date())).length;
  const failed = logs.filter((log) => log.status !== "SENT").length;
  const activityTrend = Array.from({ length: 14 }).map((_, index) => {
    const date = new Date(); date.setDate(date.getDate() - (13 - index)); const key = date.toISOString().slice(5, 10);
    return { label: key, value: logs.filter((log) => log.sentAt.toISOString().slice(5, 10) === key).length };
  });
  const categoryData = categories.map((category) => ({ label: category, value: enriched.filter((template) => template.category === category).length }));
  const sample = { name: "Meera", email: "meera@example.com", program: "Orientation", batch: "Morning Batch", session_date: "20 Jun 2026", session_time: "7:00 PM IST", zoom_link: "https://zoom.us/j/example", meeting_id: "842 1284 9283", meeting_password: "CALM", payment_amount: "₹199", booking_reference: "ICH-000101", certificate_link: "https://ichaitanya.com/certificate" };

  return (
    <div className="space-y-6">
      <div><p className="text-sm font-semibold uppercase tracking-widest text-accent">Communication Automation</p><h1 className="font-serif text-4xl font-bold">Email Templates</h1><p className="mt-2 text-sm text-muted-foreground">Manage all automated emails sent to participants.</p></div>
      <div className="grid gap-4 md:grid-cols-5"><Stat title="Total Templates" value={templates.length} /><Stat title="Active Templates" value={templates.filter((t) => t.active).length} /><Stat title="Emails Sent Today" value={sentToday} /><Stat title="Failed Emails" value={failed} /><Stat title="Automation Rules" value={triggers.length} /></div>
      <div className="flex flex-wrap gap-2">{["ALL", ...categories].map((category) => <Button key={category} asChild size="sm" variant={(params.category ?? "ALL") === category ? "accent" : "outline"}><a href={category === "ALL" ? "/admin/email-templates" : `/admin/email-templates?category=${category}`}>{category}</a></Button>)}</div>
      <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <Card><CardHeader><CardTitle>Template Editor</CardTitle><CardDescription>Rich text/HTML body, WhatsApp match, attachments, triggers, and variants.</CardDescription></CardHeader><CardContent><TemplateForm categories={categories} triggers={triggers} /></CardContent></Card>
        <div className="grid gap-6">
          <Card><CardHeader><CardTitle>Dynamic Variables</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{variables.map((v) => <Badge key={v}>{v}</Badge>)}</CardContent></Card>
          <Chart title="Emails Sent Per Day"><AdminLineChart data={activityTrend} /></Chart>
          <Chart title="Templates By Category"><AdminBarChart data={categoryData} /></Chart>
        </div>
      </div>
      <Card><CardHeader><CardTitle>Template List</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Template Name</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead><TableHead>Last Modified</TableHead><TableHead>Usage</TableHead><TableHead>Trigger</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{enriched.map((template) => <TableRow key={template.id}><TableCell className="font-medium">{template.name}</TableCell><TableCell>{template.category}</TableCell><TableCell><Badge>{template.status}</Badge></TableCell><TableCell>{formatDate(template.updatedAt)}</TableCell><TableCell>{template.usage}</TableCell><TableCell>{template.trigger}</TableCell><TableCell><div className="flex flex-wrap gap-1"><Button size="sm" variant="outline"><Eye className="h-4 w-4" /> Preview</Button><form action={duplicateEmailTemplate.bind(null, template.id)}><Button size="sm" variant="outline"><Copy className="h-4 w-4" /> Duplicate</Button></form><form action={setEmailTemplateStatus.bind(null, template.id, "Disabled")}><Button size="sm" variant="outline">Disable</Button></form><form action={deleteEmailTemplate.bind(null, template.id)}><Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /></Button></form></div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>Email Preview</CardTitle><CardDescription>Desktop, tablet, and mobile sample-data preview.</CardDescription></CardHeader><CardContent><div className="rounded-lg border bg-white p-5 text-primary shadow-sm"><p className="text-xs text-muted-foreground">Subject: Your {sample.program} session details</p><h2 className="mt-3 font-serif text-2xl font-bold">Namaste {sample.name}</h2><p className="mt-3 text-sm leading-6">Your {sample.program} session is scheduled for {sample.session_date} at {sample.session_time}. Join here: {sample.zoom_link}</p><Button className="mt-4" variant="accent">Join Session</Button></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Recent Email Activity</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Recipient</TableHead><TableHead>Template</TableHead><TableHead>Sent</TableHead><TableHead>Status</TableHead><TableHead>Opened</TableHead><TableHead>Clicked</TableHead></TableRow></TableHeader><TableBody>{logs.slice(0, 10).map((log) => <TableRow key={log.id}><TableCell>{log.recipient}</TableCell><TableCell>{log.template?.name ?? log.subject}</TableCell><TableCell>{formatDate(log.sentAt)}</TableCell><TableCell>{log.status}</TableCell><TableCell>{log.status === "SENT" ? "Simulated" : "-"}</TableCell><TableCell>{log.status === "SENT" ? "Tracked" : "-"}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
      </div>
    </div>
  );
}

function TemplateForm({ categories, triggers }: { categories: string[]; triggers: string[] }) {
  return <form action={saveEmailTemplate} className="grid gap-3 md:grid-cols-2"><Input name="name" placeholder="Template Name" required /><Input name="templateKey" placeholder="template_key" /><Input name="subject" placeholder="Subject Line" required /><Select name="category" options={categories} /><Select name="status" options={["Draft", "Active", "Disabled"]} /><Select name="trigger" options={triggers} /><Select name="language" options={["English", "Hindi", "Custom Language"]} /><Input name="attachments" placeholder="ICS, invoice, certificate, guide" /><Textarea name="body" className="md:col-span-2 min-h-40" placeholder="Rich text / HTML editor content" required /><Textarea name="whatsapp" className="md:col-span-2" placeholder="Matching WhatsApp template" /><Input name="testRecipient" placeholder="Recipient Email for Test" /><Button type="button" variant="outline"><Send className="h-4 w-4" /> Send Test Email</Button><Button variant="accent" className="md:col-span-2"><Mail className="h-4 w-4" /> Save Template</Button></form>;
}
function Stat({ title, value }: { title: string; value: number }) { return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-3xl font-bold">{value}</p></CardContent></Card>; }
function Chart({ title, children }: { title: string; children: React.ReactNode }) { return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{children}</CardContent></Card>; }
function Select({ name, options }: { name: string; options: string[] }) { return <select name={name} className="h-10 rounded-md border bg-background px-3 text-sm">{options.map((option) => <option key={option}>{option}</option>)}</select>; }
function sameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
