import Image from "next/image";
import Link from "next/link";
import { publicNav } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-background">
      <header className="sticky top-0 z-40 border-b bg-[#FAF7F2]/90 backdrop-blur dark:bg-background/90">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/ichaitanya-logo.png" alt="iChaitanya" width={260} height={56} className="h-14 w-auto object-contain sm:h-16" priority />
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-medium text-muted-foreground lg:flex">
            {publicNav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-accent">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button asChild variant="accent" className="hidden sm:inline-flex">
              <Link href="/orientation">Secure My Seat</Link>
            </Button>
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Image src="/ichaitanya-logo.png" alt="iChaitanya" width={260} height={56} className="h-14 w-auto object-contain" />
            </div>
            <p className="max-w-md text-sm text-primary-foreground/75">Meditation is already within you. Return to your natural state of calm through live guided iChaitanya experiences.</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Programs</p>
            <Link className="block text-primary-foreground/75 hover:text-white" href="/orientation">Live Orientation</Link>
            <Link className="block text-primary-foreground/75 hover:text-white" href="/bliss-path">Bliss Path</Link>
            <Link className="block text-primary-foreground/75 hover:text-white" href="/aura-night">Aura Night</Link>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Connect</p>
            <a className="block text-primary-foreground/75 hover:text-white" href="https://wa.me/919217639689">+91 92176 39689</a>
            <Link className="block text-primary-foreground/75 hover:text-white" href="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function FounderImage({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-muted shadow-soft ${className}`}>
      <Image src="/umesh-misra.jpeg" alt="Founder of iChaitanya, Umesh Misra" fill className="object-cover" priority />
    </div>
  );
}
