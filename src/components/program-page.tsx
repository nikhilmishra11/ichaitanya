import Link from "next/link";
import { programs } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicShell, FounderImage } from "@/components/public-shell";

export function ProgramPage({ slug }: { slug: string }) {
  const program = programs.find((item) => item.slug === slug) ?? programs[0];
  return (
    <PublicShell>
      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div className="flex flex-col justify-center">
            <p className="mb-4 w-fit rounded-full bg-accent/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-accent">{program.eyebrow}</p>
            <h1 className="font-serif text-4xl font-bold leading-tight sm:text-5xl">{program.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{program.summary}</p>
            <div className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
              <Card><CardContent className="p-5"><p className="text-muted-foreground">Duration</p><p className="mt-1 text-lg font-semibold">{program.duration}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-muted-foreground">Fee</p><p className="mt-1 text-lg font-semibold">{program.price}</p></CardContent></Card>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="accent" size="lg"><Link href="/contact">{program.cta}</Link></Button>
              <Button asChild variant="outline" size="lg"><Link href="/testimonials">Read Stories</Link></Button>
            </div>
          </div>
          <FounderImage className="min-h-[420px]" />
        </section>
        <section className="bg-white py-16 dark:bg-card">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="font-serif text-3xl font-bold">What this experience opens</h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">{program.description}</p>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
