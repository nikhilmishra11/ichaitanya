"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BarChart3, BookOpen, CalendarCog, CreditCard, FileText, LayoutDashboard, LogOut, Mail, MoonStar, Settings, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

const groups = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Bookings", href: "/admin/bookings", icon: Users },
  { label: "Orientation Settings", href: "/admin/orientation-settings", icon: CalendarCog },
  { label: "Programs", href: "/admin/programs", icon: BookOpen },
  { label: "Aura Night", href: "/admin/aura-night", icon: MoonStar },
  { label: "Testimonials", href: "/admin/testimonials", icon: Star },
  { label: "Email Templates", href: "/admin/email-templates", icon: Mail },
  { label: "Payment Logs", href: "/admin/logs/payment", icon: CreditCard },
  { label: "Email Logs", href: "/admin/logs/email", icon: FileText },
  { label: "Server Config", href: "/admin/environment-settings/server-config", icon: Settings },
  { label: "Tutorial", href: "/admin/tutorial", icon: BarChart3 }
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-primary text-primary-foreground lg:flex lg:flex-col">
      <div className="flex h-20 items-center justify-between px-6">
        <Link href="/admin/dashboard" className="flex items-center">
          <Image src="/ichaitanya-logo.png" alt="iChaitanya" width={230} height={50} className="h-12 w-auto object-contain" priority />
        </Link>
        <ModeToggle />
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4">
        {groups.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          const nested = item.label === "Payment Logs" || item.label === "Email Logs" || item.label === "Server Config";
          return (
            <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-primary-foreground/75 hover:bg-white/10 hover:text-white", active && "bg-accent text-primary", nested && "ml-5")}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <Button variant="ghost" className="w-full justify-start text-primary-foreground hover:bg-white/10 hover:text-white" onClick={() => signOut({ callbackUrl: "/admin/login" })}>
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>
    </aside>
  );
}
