import Link from "next/link";
import { BookOpen, CreditCard, HelpCircle, Mail, PlayCircle, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const categories = [
  { name: "Getting Started", icon: BookOpen, articles: ["Dashboard Overview", "Admin Navigation", "Common Workflows"] },
  { name: "Orientation Management", icon: PlayCircle, articles: ["Create Orientation Slots", "Pricing Setup", "Zoom Configuration", "Capacity Management"] },
  { name: "Program Management", icon: BookOpen, articles: ["Create Program", "Edit Program", "Manage Batches", "Program Pricing"] },
  { name: "Booking Management", icon: Users, articles: ["View Bookings", "Reschedule Participant", "Attendance Tracking", "Export Reports"] },
  { name: "Payment Management", icon: CreditCard, articles: ["Razorpay", "PayPal", "Refunds", "Revenue Reports"] },
  { name: "Aura Night", icon: PlayCircle, articles: ["Create Journey", "Daily Sessions", "Attendance", "Reminders"] },
  { name: "Testimonials", icon: HelpCircle, articles: ["Add Testimonial", "Approve Testimonial", "Feature Testimonial"] },
  { name: "Email Templates", icon: Mail, articles: ["Edit Templates", "Variables", "Testing Emails"] },
  { name: "Environment Settings", icon: Settings, articles: ["Payment Gateway Setup", "Zoom Setup", "Email Setup", "WhatsApp Setup"] }
];

const faqs = ["How do I create a new orientation slot?", "How do I refund a payment?", "How do I resend Zoom links?", "How do I change pricing?", "How do I export participant data?"];
const troubleshooting = ["Payment Failed", "Email Not Delivered", "Zoom Link Missing", "Participant Cannot Join", "Refund Not Working", "Automation Failed"];

export default function TutorialPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  return <TutorialContent searchParams={searchParams} />;
}

async function TutorialContent({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const q = (params.q ?? "").toLowerCase();
  const matches = categories.flatMap((category) => category.articles.map((article) => ({ category: category.name, title: article }))).filter((article) => !q || `${article.category} ${article.title}`.toLowerCase().includes(q));

  return (
    <div className="space-y-6">
      <div><p className="text-sm font-semibold uppercase tracking-widest text-accent">Help Center</p><h1 className="font-serif text-4xl font-bold">Admin Panel Guide</h1><p className="mt-2 text-sm text-muted-foreground">Learn how to manage programs, bookings, payments, communications, and system settings.</p></div>
      <div className="grid gap-4 md:grid-cols-6"><Dash title="Getting Started" /><Dash title="Programs" /><Dash title="Bookings" /><Dash title="Payments" /><Dash title="Email Templates" /><Dash title="System Settings" /></div>
      <Card><CardHeader><CardTitle>Search Knowledge Base</CardTitle><CardDescription>Search program, booking, payment, email, Zoom, Aura Night, Orientation, and settings articles.</CardDescription></CardHeader><CardContent><form className="grid gap-3 md:grid-cols-[1fr_auto]"><Input name="q" defaultValue={params.q ?? ""} placeholder="Search help articles..." /><Button variant="accent">Search</Button></form></CardContent></Card>
      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <Card><CardHeader><CardTitle>Documentation Categories</CardTitle></CardHeader><CardContent className="grid gap-3">{categories.map((category) => { const Icon = category.icon; return <a key={category.name} href={`#${slug(category.name)}`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted"><Icon className="h-5 w-5 text-accent" /><span className="font-medium">{category.name}</span></a>; })}</CardContent></Card>
        <Card><CardHeader><CardTitle>Matching Articles</CardTitle><CardDescription>Instant article matches based on your search.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{matches.map((article) => <ArticleCard key={`${article.category}-${article.title}`} category={article.category} title={article.title} />)}</CardContent></Card>
      </div>
      <div className="grid gap-6">
        {categories.map((category) => <Card key={category.name} id={slug(category.name)}><CardHeader><CardTitle>{category.name}</CardTitle><CardDescription>{category.articles.length} help articles</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">{category.articles.map((article) => <ArticleCard key={article} category={category.name} title={article} />)}</CardContent></Card>)}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>Interactive Walkthrough Mode</CardTitle><CardDescription>Guided onboarding flow for new admins.</CardDescription></CardHeader><CardContent className="space-y-3">{["Open the Dashboard and review KPIs", "Create or edit a program", "Open Bookings and filter participants", "Export or send a participant communication"].map((step, index) => <div key={step} className="rounded-lg border p-4"><p className="text-sm text-accent">Step {index + 1}</p><p className="font-medium">{step}</p></div>)}<div className="flex gap-2"><Button variant="outline">Previous</Button><Button variant="accent">Next</Button></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Video Tutorials</CardTitle><CardDescription>YouTube, Vimeo, and embedded module tutorials.</CardDescription></CardHeader><CardContent className="grid gap-3">{["Admin Dashboard Walkthrough", "Managing Orientation Slots", "Bookings and Attendance", "Payment Refunds", "Email Template Testing"].map((video) => <div key={video} className="flex items-center gap-3 rounded-lg border p-4"><PlayCircle className="h-6 w-6 text-accent" /><div><p className="font-medium">{video}</p><p className="text-sm text-muted-foreground">Embedded video placeholder</p></div></div>)}</CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>FAQ</CardTitle></CardHeader><CardContent className="space-y-3">{faqs.map((faq) => <details key={faq} className="rounded-lg border p-4"><summary className="cursor-pointer font-medium">{faq}</summary><p className="mt-3 text-sm text-muted-foreground">Open the relevant admin module, use the action button in the page header, and follow the form labels. Related articles are listed below each module section.</p></details>)}</CardContent></Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/admin/programs">Open Programs</Link></Button><Button asChild variant="outline"><Link href="/admin/bookings">Open Bookings</Link></Button><Button asChild variant="outline"><Link href="/admin/logs/payment">Open Payments</Link></Button><Button asChild variant="outline"><Link href="/admin/email-templates">Open Email Templates</Link></Button><Button asChild variant="outline"><Link href="/admin/environment-settings/server-config">Open Environment Settings</Link></Button></CardContent></Card>
        <Card><CardHeader><CardTitle>System Status Help</CardTitle></CardHeader><CardContent className="grid gap-2">{["Payment Gateway Status", "Email Service Status", "Zoom Status", "Background Jobs Status"].map((item) => <div key={item} className="flex items-center justify-between rounded-lg border p-3"><span>{item}</span><span className="text-green-700">Healthy</span></div>)}</CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Troubleshooting</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-3">{troubleshooting.map((topic) => <ArticleCard key={topic} category="Troubleshooting" title={topic} />)}</CardContent></Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>Release Notes</CardTitle></CardHeader><CardContent className="space-y-3">{[{ v: "1.6", d: "2026-06-13", c: "Aura Night, Programs, Orientation, Bookings upgrades" }, { v: "1.5", d: "2026-06-12", c: "Analytics dashboard and exports" }].map((note) => <div key={note.v} className="rounded-lg border p-4"><p className="font-semibold">Version {note.v}</p><p className="text-sm text-muted-foreground">{note.d}</p><p className="mt-2 text-sm">{note.c}</p></div>)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Help Requests</CardTitle><CardDescription>Submit a question, issue, or feature request.</CardDescription></CardHeader><CardContent><form className="grid gap-3"><Input name="subject" placeholder="Question / Issue / Feature Request" /><Textarea name="description" placeholder="Describe what you need help with" /><select name="priority" className="h-10 rounded-md border bg-background px-3 text-sm"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select><Button variant="accent">Submit Help Request</Button></form></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Admin Training Mode</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Guided onboarding tooltips can be enabled for admin pages, for example: “Click here to create a new program” and “Use this button to export bookings.”</p><Button className="mt-3" variant="accent">Enable Guided Onboarding</Button></CardContent></Card>
    </div>
  );
}

function Dash({ title }: { title: string }) { return <Card><CardContent className="p-5"><p className="font-semibold">{title}</p><p className="mt-2 text-sm text-muted-foreground">Open guide</p></CardContent></Card>; }
function ArticleCard({ category, title }: { category: string; title: string }) { return <div className="rounded-lg border p-4"><p className="text-xs font-semibold uppercase tracking-widest text-accent">{category}</p><h3 className="mt-2 font-serif text-xl font-bold">{title}</h3><p className="mt-2 text-sm text-muted-foreground">Overview, step-by-step instructions, screenshots placeholder, tips, warnings, related articles, and last updated date.</p><p className="mt-3 text-xs text-muted-foreground">Last updated: June 13, 2026</p></div>; }
function slug(value: string) { return value.toLowerCase().replaceAll(" ", "-"); }
