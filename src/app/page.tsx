import Link from "next/link";
import { PublicShell, FounderImage } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { programs, shifts, prerequisites } from "@/lib/content";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <PublicShell>
      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:gap-16 lg:py-[4.5rem]">
          <div className="flex flex-col justify-center">
            <p className="mb-6 w-fit border-b border-accent/60 pb-2 text-xs font-bold uppercase tracking-widest text-accent">Live guided Zoom batches</p>
            <h1 className="font-serif text-5xl font-semibold leading-[.98] text-primary sm:text-6xl lg:text-7xl dark:text-foreground">
              You&apos;ve already felt a calm mind.
              <span className="block text-accent">Now return to it, consciously.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Return to your natural state of calm, and discover meditation as something already within you. Live 40 min iChaitanya Dhyan orientation with Umesh Misra.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="accent" size="lg"><Link href="/orientation">Secure My Seat for the Live Orientation</Link></Button>
              <Button asChild variant="outline" size="lg"><Link href="/bliss-path">Explore Bliss Path</Link></Button>
            </div>
          </div>
          <div className="grid gap-4">
            <FounderImage className="min-h-[420px] sm:min-h-[520px]" />
            <div className="rounded-lg border bg-card/80 p-4 shadow-[0_12px_34px_rgba(38,25,21,0.04)]">
              <p className="text-sm font-semibold">Saarthi Umesh Misra</p>
              <p className="text-sm text-muted-foreground">Guiding live iChaitanya meditation experiences.</p>
            </div>
          </div>
        </section>

        <section className="bg-primary py-16 text-primary-foreground sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">iChaitanya</p>
            <h2 className="mt-3 max-w-4xl font-serif text-4xl font-semibold leading-tight sm:text-6xl">A significant shift begins within you</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-5">
              {shifts.map((shift, index) => (
                <div key={shift} className="rounded-lg border border-white/10 bg-white/[.045] p-5">
                  <p className="text-sm text-accent">0{index + 1}</p>
                  <p className="mt-3 text-sm leading-6 text-primary-foreground/80">{shift}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">Programs</p>
              <h2 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">Discover guided programs</h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {programs.map((program) => (
              <Card key={program.slug} className="overflow-hidden">
                <CardContent className="flex h-full flex-col p-6">
                  <Sparkles className="mb-5 h-6 w-6 text-accent" />
                  <h3 className="font-serif text-3xl font-semibold leading-tight">{program.name}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{program.summary}</p>
                  <Button asChild variant="outline" className="mt-6 justify-between">
                    <Link href={`/${program.slug}`}>Explore <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-card/70 py-16 dark:bg-card sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="font-serif text-4xl font-semibold sm:text-5xl">Your 40-minute orientation needs only this</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {prerequisites.map((item) => (
                <div key={item.title} className="flex gap-4 rounded-lg border bg-background/60 p-5">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
