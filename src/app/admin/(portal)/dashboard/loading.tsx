import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div className="space-y-3">
          <div className="h-4 w-36 animate-pulse rounded bg-muted" />
          <div className="h-10 w-72 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index}><CardContent className="space-y-4 p-6"><div className="h-4 w-28 animate-pulse rounded bg-muted" /><div className="h-8 w-20 animate-pulse rounded bg-muted" /></CardContent></Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}><CardHeader><div className="h-6 w-48 animate-pulse rounded bg-muted" /></CardHeader><CardContent><div className="h-72 animate-pulse rounded bg-muted" /></CardContent></Card>
        ))}
      </div>
    </div>
  );
}
