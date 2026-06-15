import { prisma } from "@/lib/prisma";
import { PublicShell } from "@/components/public-shell";
import { Card, CardContent } from "@/components/ui/card";

export default async function TestimonialsPage() {
  const testimonials = await prisma.testimonial.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } });
  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">Testimonials</p>
        <h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">Real Stories of Quiet Minds</h1>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <p className="text-lg leading-8">&quot;{item.content}&quot;</p>
                <p className="mt-6 font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.country}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </PublicShell>
  );
}
