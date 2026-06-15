import { PublicShell, FounderImage } from "@/components/public-shell";

export default function AboutPage() {
  return (
    <PublicShell>
      <main className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[.9fr_1.1fr]">
        <FounderImage className="min-h-[520px]" />
        <div className="flex flex-col justify-center">
          <p className="mb-4 w-fit rounded-full bg-accent/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-accent">The Philosophy & Saarthi</p>
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">Meditation is Already Within You</h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            The role of a Saarthi is not to preach. A Saarthi, a charioteer, does not dictate your destiny. He simply guides your carriage safely back toward the stillness you have already experienced inside.
          </p>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            iChaitanya helps you return to that natural state through simple, live, guided meditation experiences with Umesh Misra.
          </p>
        </div>
      </main>
    </PublicShell>
  );
}
