import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">Contact</p>
        <h1 className="mt-3 font-serif text-4xl font-bold">Request guidance</h1>
        <form action="/api/contact" method="post" className="mt-8 grid gap-4 rounded-lg border bg-white p-6 dark:bg-card">
          <Input name="name" placeholder="Name" required />
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="phone" placeholder="Mobile (WhatsApp)" />
          <Textarea name="message" placeholder="Tell us what you are looking for" required />
          <Button variant="accent" type="submit">Send Request</Button>
        </form>
      </main>
    </PublicShell>
  );
}
