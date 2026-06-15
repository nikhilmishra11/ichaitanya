export async function GET() {
  const csv = `"Subject","Description","Status","Priority"\n"Sample help request","No stored requests in no-migration mode","Open","Medium"`;
  return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=help-requests.csv" } });
}
