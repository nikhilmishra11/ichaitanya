export default function AdminLoading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-8 py-6 shadow-soft">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-accent" />
        <p className="text-sm font-medium text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
