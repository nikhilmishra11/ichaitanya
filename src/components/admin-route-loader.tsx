"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function AdminRouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setLoading(false);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, [pathname, searchParams]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      const current = `${window.location.pathname}${window.location.search}`;
      const next = href.startsWith("/") ? href : null;
      if (!next) return;

      if (next === current || !next.startsWith("/admin")) return;

      setLoading(true);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setLoading(false), 8000);
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 grid place-items-center bg-[#FAF7F2]/55 backdrop-blur-[2px] dark:bg-background/55 lg:left-72 left-0">
      <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-8 py-6 shadow-soft">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-accent" />
        <p className="text-sm font-medium text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
