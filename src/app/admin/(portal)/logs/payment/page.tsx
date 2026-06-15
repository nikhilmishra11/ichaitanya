import type React from "react";
import { Copy, FileDown, Mail, ReceiptText, RefreshCcw } from "lucide-react";
import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminBarChart, AdminLineChart, AdminPieChart } from "@/components/admin-analytics-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PaymentLogsPage({ searchParams }: { searchParams: Promise<{ provider?: string; status?: string; currency?: string; q?: string; country?: string; program?: string }> }) {
  const params = await searchParams;
  const where: Prisma.PaymentWhereInput = {
    ...(params.provider && params.provider !== "ALL" ? { provider: params.provider } : {}),
    ...(params.status && params.status !== "ALL" ? { status: params.status as BookingStatus } : {}),
    ...(params.currency && params.currency !== "ALL" ? { currency: params.currency } : {}),
    ...(params.q ? { OR: [{ transactionId: { contains: params.q } }, { booking: { name: { contains: params.q } } }, { booking: { bookingReference: { contains: params.q } } }] } : {}),
    ...(params.country && params.country !== "ALL" ? { booking: { country: params.country } } : {}),
    ...(params.program && params.program !== "ALL" ? { booking: { programId: params.program } } : {})
  };
  const [payments, programs, countries] = await Promise.all([
    prisma.payment.findMany({ where, include: { booking: { include: { program: true, batch: true } }, logs: true }, orderBy: { createdAt: "desc" }, take: 120 }),
    prisma.program.findMany({ orderBy: { name: "asc" } }),
    prisma.booking.groupBy({ by: ["country"], _count: true })
  ]);
  const totalRevenue = payments.filter((p) => p.status === "PAID").reduce((sum, p) => sum + toInr(p.amount, p.currency), 0);
  const todayRevenue = payments.filter((p) => p.status === "PAID" && sameDay(p.createdAt, new Date())).reduce((sum, p) => sum + toInr(p.amount, p.currency), 0);
  const successful = payments.filter((p) => p.status === "PAID").length;
  const pending = payments.filter((p) => p.status === "PENDING").length;
  const failed = payments.filter((p) => p.status === "FAILED" || p.status === "CANCELLED").length;
  const refunds = payments.filter((p) => p.status === "REFUNDED").length;
  const expected = payments.reduce((sum, p) => sum + toInr(p.amount, p.currency), 0);
  const revenueTrend = trend(payments.filter((p) => p.status === "PAID").map((p) => ({ date: p.createdAt, value: toInr(p.amount, p.currency) })));
  const programRevenue = programs.map((program) => ({ label: program.name, value: payments.filter((p) => p.booking.programId === program.id && p.status === "PAID").reduce((sum, p) => sum + toInr(p.amount, p.currency), 0) }));
  const countryRevenue = countries.map((c) => ({ name: c.country, value: payments.filter((p) => p.booking.country === c.country && p.status === "PAID").reduce((sum, p) => sum + toInr(p.amount, p.currency), 0) })).filter((row) => row.value > 0).slice(0, 6);
  const failureRate = payments.length ? Math.round((failed / payments.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div><p className="text-sm font-semibold uppercase tracking-widest text-accent">Payment Operations</p><h1 className="font-serif text-4xl font-bold">Payment Logs</h1><p className="mt-2 text-sm text-muted-foreground">Monitor, reconcile, refund, and analyze all payment transactions.</p></div>
      <div className="grid gap-4 md:grid-cols-6"><Stat title="Total Revenue" value={formatCurrency(totalRevenue, "INR")} /><Stat title="Successful" value={successful} /><Stat title="Pending" value={pending} /><Stat title="Failed" value={failed} /><Stat title="Refunds" value={refunds} /><Stat title="Today's Revenue" value={formatCurrency(todayRevenue, "INR")} /></div>
      <Card><CardHeader><CardTitle>Advanced Filters</CardTitle></CardHeader><CardContent><form className="grid gap-3 md:grid-cols-4 xl:grid-cols-8"><Input name="q" defaultValue={params.q ?? ""} placeholder="Name / booking / transaction" className="xl:col-span-2" /><Select name="provider" value={params.provider ?? "ALL"} options={["ALL", "Razorpay", "PayPal", "Manual"]} /><Select name="status" value={params.status ?? "ALL"} options={["ALL", "PENDING", "PAID", "FAILED", "CANCELLED", "REFUNDED"]} /><Select name="currency" value={params.currency ?? "ALL"} options={["ALL", "INR", "USD"]} /><SelectPairs name="program" value={params.program ?? "ALL"} options={[["ALL", "All Programs"], ...programs.map((p) => [p.id, p.name] as [string, string])]} /><SelectPairs name="country" value={params.country ?? "ALL"} options={[["ALL", "All Countries"], ...countries.map((c) => [c.country, c.country] as [string, string])]} /><Input name="amount" placeholder="Amount Range" /><Button variant="accent">Apply</Button></form></CardContent></Card>
      <div className="grid gap-6 xl:grid-cols-3"><Chart title="Revenue Trend"><AdminLineChart data={revenueTrend} color="#2B1712" /></Chart><Chart title="Revenue By Program"><AdminBarChart data={programRevenue} /></Chart><Chart title="Revenue By Country"><AdminPieChart data={countryRevenue} /></Chart></div>
      <div className="grid gap-4 md:grid-cols-4"><Stat title="Expected Revenue" value={formatCurrency(expected, "INR")} /><Stat title="Actual Revenue" value={formatCurrency(totalRevenue, "INR")} /><Stat title="Difference" value={formatCurrency(expected - totalRevenue, "INR")} /><Stat title="Failure Rate" value={`${failureRate}%`} /></div>
      <Card><CardHeader><CardTitle>Payment List</CardTitle><CardDescription>Click rows mentally as expandable payment cards; detail information and timeline are shown inline.</CardDescription></CardHeader><CardContent className="space-y-4">{payments.map((payment) => <details key={payment.id} className="rounded-lg border p-4"><summary className="cursor-pointer list-none"><div className="grid gap-3 xl:grid-cols-[1.1fr_1fr_1fr_1fr_1fr_auto]"><span className="font-mono text-xs">{payment.transactionId}</span><span>{payment.booking.bookingReference}</span><span>{payment.booking.name}</span><span>{payment.booking.program.name}</span><span>{formatCurrency(payment.amount, payment.currency)}</span><Badge className={statusClass(payment.status)}>{payment.status}</Badge></div></summary><div className="mt-4 grid gap-4 lg:grid-cols-3"><Info title="Participant Information" rows={[["Name", payment.booking.name], ["Email", payment.booking.email], ["Phone", payment.booking.phone], ["Country", payment.booking.country]]} /><Info title="Program Information" rows={[["Program", payment.booking.program.name], ["Batch", payment.booking.batch?.id.slice(0, 8) ?? "Unassigned"], ["Session Date", payment.booking.batch ? formatDate(payment.booking.batch.startsAt) : "-"], ["Booking Reference", payment.booking.bookingReference]]} /><Info title="Payment Information" rows={[["Gateway", payment.provider], ["Order ID", `ORD-${payment.id.slice(0, 8)}`], ["Fees", formatCurrency(Math.round(payment.amount * 0.02), payment.currency)], ["Net Amount", formatCurrency(Math.round(payment.amount * 0.98), payment.currency)], ["Tax", formatCurrency(0, payment.currency)], ["Paid Date", payment.paidAt ? formatDate(payment.paidAt) : "-"]]} /></div><div className="mt-4 rounded-lg border p-4"><p className="mb-3 font-semibold">Payment Timeline</p><div className="grid gap-2 text-sm md:grid-cols-4"><Badge>Created</Badge><Badge>Authorized</Badge><Badge>{payment.status === "PAID" ? "Captured" : payment.status}</Badge><Badge>{payment.status === "REFUNDED" ? "Refunded" : "No refund"}</Badge></div></div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline"><ReceiptText className="h-4 w-4" /> Receipt</Button><Button size="sm" variant="outline">Invoice</Button><Button size="sm" variant="outline"><Mail className="h-4 w-4" /> Resend Receipt</Button><Button size="sm" variant="outline"><RefreshCcw className="h-4 w-4" /> Refund</Button><Button size="sm" variant="outline">Manual Payment</Button><Button size="sm" variant="outline"><Copy className="h-4 w-4" /> Copy ID</Button></div></details>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Exports & Reports</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2"><Button asChild variant="outline"><a href="/api/revenue/export"><FileDown className="h-4 w-4" /> CSV</a></Button><Button variant="outline">Excel</Button><Button variant="outline">PDF</Button><Button variant="outline">Refund Report</Button><Button variant="outline">Tax Report</Button></CardContent></Card>
    </div>
  );
}
function toInr(amount: number, currency: string) { return currency === "USD" ? amount * 83 : amount; }
function sameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function trend(items: { date: Date; value: number }[]) { return Array.from({ length: 14 }).map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (13 - i)); const k = d.toISOString().slice(5, 10); return { label: k, value: items.filter((x) => x.date.toISOString().slice(5, 10) === k).reduce((s, x) => s + x.value, 0) }; }); }
function Stat({ title, value }: { title: string; value: string | number }) { return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-2xl font-bold">{value}</p></CardContent></Card>; }
function Chart({ title, children }: { title: string; children: React.ReactNode }) { return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{children}</CardContent></Card>; }
function Select({ name, value, options }: { name: string; value: string; options: string[] }) { return <select name={name} defaultValue={value} className="h-10 rounded-md border bg-background px-3 text-sm">{options.map((o) => <option key={o}>{o}</option>)}</select>; }
function SelectPairs({ name, value, options }: { name: string; value: string; options: [string, string][] }) { return <select name={name} defaultValue={value} className="h-10 rounded-md border bg-background px-3 text-sm">{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>; }
function Info({ title, rows }: { title: string; rows: [string, string][] }) { return <div className="rounded-lg border p-4"><p className="mb-3 font-semibold">{title}</p>{rows.map(([k, v]) => <div key={k} className="grid grid-cols-[130px_1fr] gap-2 text-sm"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>)}</div>; }
function statusClass(status: BookingStatus) { return status === "PAID" ? "border-green-200 bg-green-50 text-green-700" : status === "PENDING" ? "border-orange-200 bg-orange-50 text-orange-700" : status === "REFUNDED" ? "border-gray-200 bg-gray-50 text-gray-700" : "border-red-200 bg-red-50 text-red-700"; }
