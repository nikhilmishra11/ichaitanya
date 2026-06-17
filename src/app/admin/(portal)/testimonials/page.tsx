import type React from "react";
import { Archive, Eye, Pencil, PlusCircle, Star, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { metadataMap } from "@/lib/admin-metadata";
import { AdminBarChart, AdminPieChart } from "@/components/admin-analytics-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { deleteTestimonial, saveTestimonial, setTestimonialStatus } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const meta = (id: string, field: string) => `testimonial_${id}_${field}`;

export default async function TestimonialsAdminPage({ searchParams }: { searchParams: Promise<{ q?: string; program?: string; country?: string; type?: string; status?: string; rating?: string }> }) {
  const params = await searchParams;
  const { items, configs, programs } = await getTestimonialsData();
  const config = metadataMap(configs);
  const enriched = items.map((item) => ({
    ...item,
    status: config[meta(item.id, "status")] ?? (item.featured ? "Featured" : item.active ? "Published" : "Draft"),
    rating: Number(config[meta(item.id, "rating")] ?? 5),
    type: config[meta(item.id, "type")] ?? item.category,
    programs: config[meta(item.id, "programs")] ?? "",
    photo: config[meta(item.id, "photo")] ?? "",
    email: config[meta(item.id, "email")] ?? "",
    headline: config[meta(item.id, "headline")] ?? ""
  })).filter((item) => {
    const q = (params.q ?? "").toLowerCase();
    return (!q || `${item.name} ${item.email} ${item.content}`.toLowerCase().includes(q))
      && (!params.country || params.country === "ALL" || item.country === params.country)
      && (!params.type || params.type === "ALL" || item.category === params.type)
      && (!params.status || params.status === "ALL" || item.status === params.status)
      && (!params.rating || params.rating === "ALL" || String(item.rating) === params.rating)
      && (!params.program || params.program === "ALL" || item.programs.includes(params.program));
  });
  const videoCount = enriched.filter((item) => item.category.toLowerCase().includes("video")).length;
  const countryData = Array.from(new Set(enriched.map((item) => item.country))).map((country) => ({ name: country, value: enriched.filter((item) => item.country === country).length }));
  const programData = programs.map((program) => ({ label: program.name, value: enriched.filter((item) => item.programs.includes(program.id) || item.programs.includes(program.name)).length }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-sm font-semibold uppercase tracking-widest text-accent">Social Proof Management</p><h1 className="font-serif text-4xl font-bold">Testimonials</h1></div>
        <Button asChild variant="accent"><a href="#add-testimonial"><PlusCircle className="h-4 w-4" /> Add Testimonial</a></Button>
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        <Stat title="Total Testimonials" value={items.length} /><Stat title="Published" value={enriched.filter((i) => i.status === "Published").length} /><Stat title="Video" value={videoCount} /><Stat title="Text" value={enriched.length - videoCount} /><Stat title="Featured" value={enriched.filter((i) => i.featured).length} />
      </div>
      <Card>
        <CardHeader><CardTitle>Filters</CardTitle><CardDescription>Search by name, keyword, or email and filter by program, country, type, status, or rating.</CardDescription></CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-6">
            <Input name="q" defaultValue={params.q ?? ""} placeholder="Search name, email, keyword" className="md:col-span-2" />
            <Select name="program" value={params.program ?? "ALL"} options={[["ALL", "All Programs"], ...programs.map((p) => [p.id, p.name] as [string, string])]} />
            <Select name="country" value={params.country ?? "ALL"} options={[["ALL", "All Countries"], ...Array.from(new Set(items.map((i) => i.country))).map((c) => [c, c] as [string, string])]} />
            <Select name="type" value={params.type ?? "ALL"} options={["ALL", "Text Testimonial", "Video Testimonial", "WhatsApp Screenshot", "Google Review", "Audio Testimonial", "Combined (Video + Text)"].map((v) => [v, v])} />
            <Select name="status" value={params.status ?? "ALL"} options={["ALL", "Draft", "Pending Review", "Approved", "Published", "Featured", "Archived"].map((v) => [v, v])} />
            <Select name="rating" value={params.rating ?? "ALL"} options={["ALL", "5", "4", "3", "2", "1"].map((v) => [v, v === "ALL" ? "All Ratings" : `${v} Star`])} />
            <Button variant="accent">Apply</Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <Card id="add-testimonial"><CardHeader><CardTitle>Add Testimonial</CardTitle></CardHeader><CardContent><TestimonialForm programs={programs} /></CardContent></Card>
        <div className="grid gap-6"><Chart title="Program-wise Count"><AdminBarChart data={programData} /></Chart><Chart title="Country Distribution"><AdminPieChart data={countryData} /></Chart></div>
      </div>
      <div className="grid gap-4">
        {enriched.map((item) => (
          <Card key={item.id}><CardContent className="grid gap-4 p-5 xl:grid-cols-[96px_1fr_360px]">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg bg-muted text-xl font-bold">{item.photo ? <img src={item.photo} alt={item.name} className="h-full w-full object-cover" /> : item.name.slice(0, 1)}</div>
            <div>
              <div className="flex flex-wrap items-center gap-2"><h2 className="font-serif text-2xl font-bold">{item.name}</h2><Badge>{item.country}</Badge><Badge>{item.category}</Badge><Badge>{item.rating} Star</Badge><Badge className={statusClass(item.status)}>{item.status}</Badge></div>
              <p className="mt-2 font-medium">{item.headline || "Participant Story"}</p>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.content}</p>
              <p className="mt-2 text-xs text-muted-foreground">Created {formatDate(item.createdAt)}</p>
            </div>
            <div className="flex flex-wrap content-start gap-2">
              <Button size="sm" variant="outline"><Eye className="h-4 w-4" /> View</Button><Button size="sm" variant="outline"><Pencil className="h-4 w-4" /> Edit</Button>
              <form action={setTestimonialStatus.bind(null, item.id, "Published")}><Button size="sm" variant="outline">Publish</Button></form>
              <form action={setTestimonialStatus.bind(null, item.id, "Featured")}><Button size="sm" variant="outline"><Star className="h-4 w-4" /> Feature</Button></form>
              <form action={setTestimonialStatus.bind(null, item.id, "Archived")}><Button size="sm" variant="outline"><Archive className="h-4 w-4" /> Archive</Button></form>
              <form action={deleteTestimonial.bind(null, item.id)}><Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /> Delete</Button></form>
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

async function getTestimonialsData() {
  try {
    const [items, configs, programs] = await Promise.all([
      prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.systemConfig.findMany({ where: { group: "testimonials" } }),
      prisma.program.findMany({ orderBy: { name: "asc" } })
    ]);
    return { items, configs, programs };
  } catch (error) {
    console.warn("Testimonials database unavailable; rendering empty social proof view.", error);
    return { items: [], configs: [], programs: [] };
  }
}

function TestimonialForm({ programs }: { programs: { id: string; name: string }[] }) {
  return <form action={saveTestimonial} className="grid gap-3 md:grid-cols-2">
    <Input name="authorName" placeholder="Author Name" required /><Input name="displayName" placeholder="Display Name" />
    <Input name="email" placeholder="Email (optional)" /><Input name="phone" placeholder="Phone (optional)" />
    <Input name="country" placeholder="Country" required /><Input name="city" placeholder="City" />
    <Input name="occupation" placeholder="Occupation" /><Input name="photo" placeholder="Profile Photo URL" />
    <select name="programs" className="h-10 rounded-md border bg-background px-3 text-sm md:col-span-2" multiple>{programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
    <Input name="headline" placeholder="Headline" /><Select name="type" value="Text Testimonial" options={["Text Testimonial", "Video Testimonial", "WhatsApp Screenshot", "Google Review", "Audio Testimonial", "Combined (Video + Text)"].map((v) => [v, v])} />
    <Textarea name="content" placeholder="Testimonial Text" className="md:col-span-2" required /><Textarea name="summary" placeholder="Experience Summary" /><Textarea name="before" placeholder="Before Meditation" /><Textarea name="after" placeholder="After Meditation" /><Textarea name="benefits" placeholder="Benefits Experienced" />
    <Select name="rating" value="5" options={["5", "4", "3", "2", "1"].map((v) => [v, `${v} Star`])} /><Select name="recommend" value="Yes" options={[["Yes", "Recommend: Yes"], ["No", "Recommend: No"]]} />
    <Input name="videoUrl" placeholder="YouTube / Vimeo / Direct Video URL" /><Input name="thumbnail" placeholder="Thumbnail URL" /><Textarea name="mediaUrls" placeholder="Screenshot / image URLs, one per line" className="md:col-span-2" />
    <Select name="status" value="Draft" options={["Draft", "Pending Review", "Approved", "Published", "Featured", "Archived"].map((v) => [v, v])} />
    <Input name="displayOrder" type="number" defaultValue={0} placeholder="Display Priority" />
    <div className="grid gap-2 text-sm md:col-span-2 md:grid-cols-3"><label><input name="featured" type="checkbox" /> Featured</label><label><input name="homepageFeatured" type="checkbox" /> Homepage Featured</label><label><input name="programFeatured" type="checkbox" /> Program Featured</label></div>
    <Input name="metaTitle" placeholder="Meta Title" /><Input name="metaDescription" placeholder="Meta Description" /><Input name="shareImage" placeholder="Social Share Image" className="md:col-span-2" />
    <Button variant="accent" className="md:col-span-2">Add Testimonial</Button>
  </form>;
}

function Stat({ title, value }: { title: string; value: number }) { return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-3xl font-bold">{value}</p></CardContent></Card>; }
function Chart({ title, children }: { title: string; children: React.ReactNode }) { return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{children}</CardContent></Card>; }
function Select({ name, value, options }: { name: string; value: string; options: Array<[string, string]> }) { return <select name={name} defaultValue={value} className="h-10 rounded-md border bg-background px-3 text-sm">{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>; }
function statusClass(status: string) { return status === "Published" || status === "Featured" ? "border-green-200 bg-green-50 text-green-700" : status === "Archived" ? "border-gray-200 bg-gray-50 text-gray-700" : "border-orange-200 bg-orange-50 text-orange-700"; }
