import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function programKey(programId: string, key: string) {
  return `program_${programId}_${key}`;
}

async function getProgram(slug: string) {
  const program = await prisma.program.findUnique({ where: { slug } }).catch(() => null);
  if (!program) return null;
  const configs = await prisma.systemConfig.findMany({ where: { group: "program", key: { startsWith: `program_${program.id}_` } } });
  const config = Object.fromEntries(configs.map((item) => [item.key, item.value]));
  return { program, config };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProgram(slug);
  if (!data) return {};
  const { program, config } = data;
  return {
    title: config[programKey(program.id, "metaTitle")] || `${program.name} - iChaitanya`,
    description: config[programKey(program.id, "metaDescription")] || program.description,
    keywords: config[programKey(program.id, "keywords")] || undefined,
    alternates: { canonical: config[programKey(program.id, "canonicalUrl")] || undefined },
    openGraph: {
      title: config[programKey(program.id, "metaTitle")] || program.name,
      description: config[programKey(program.id, "metaDescription")] || program.description,
      images: config[programKey(program.id, "openGraphImage")] ? [config[programKey(program.id, "openGraphImage")]] : undefined
    }
  };
}

export default async function GeneratedProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getProgram(slug);
  if (!data) notFound();
  const { program, config } = data;
  const heroTitle = config[programKey(program.id, "heroTitle")] || program.name;
  const heroSubtitle = config[programKey(program.id, "heroSubtitle")] || program.description;
  const overview = config[programKey(program.id, "overview")] || program.description;
  const benefits = config[programKey(program.id, "benefits")] || "Guided practice, inner clarity, calm awareness, and practical meditation support.";
  const who = config[programKey(program.id, "whoShouldJoin")] || "Anyone seeking a calm mind and a direct meditative experience.";
  const learn = config[programKey(program.id, "whatYouWillLearn")] || "You will learn how to return to stillness without force or struggle.";
  const faq = config[programKey(program.id, "faq")] || "Is it online? Yes, guided live through the configured session format.";
  const cta = config[programKey(program.id, "cta")] || "Register Now";

  return (
    <PublicShell>
      <main>
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <p className="mb-4 w-fit rounded-full bg-accent/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-accent">{program.type.replaceAll("_", " ")}</p>
          <h1 className="max-w-4xl font-serif text-4xl font-bold leading-tight sm:text-6xl">{heroTitle}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{heroSubtitle}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="accent" size="lg"><Link href="/contact">{cta}</Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="/">Home</Link></Button>
          </div>
        </section>

        <section className="bg-white py-16 dark:bg-card">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3">
            <Info title="Duration" value={program.duration ?? "Flexible"} />
            <Info title="India Price" value={formatCurrency(program.priceIndia, "INR")} />
            <Info title="International Price" value={formatCurrency(program.priceGlobal, "USD")} />
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-2">
          <Content title="Program Overview" text={overview} />
          <Content title="Benefits" text={benefits} />
          <Content title="Who Should Join" text={who} />
          <Content title="What You Will Learn" text={learn} />
          <Content title="FAQs" text={faq} />
          <Content title="Testimonials" text={config[programKey(program.id, "testimonials")] || "Participant stories will appear here."} />
        </section>
      </main>
    </PublicShell>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-2xl font-bold">{value}</p></CardContent></Card>;
}

function Content({ title, text }: { title: string; text: string }) {
  return <div className="rounded-lg border bg-card p-6"><h2 className="font-serif text-2xl font-bold">{title}</h2><p className="mt-4 whitespace-pre-line leading-7 text-muted-foreground">{text}</p></div>;
}
