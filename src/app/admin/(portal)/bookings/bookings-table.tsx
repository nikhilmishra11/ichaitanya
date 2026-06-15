"use client";

import { AttendanceStatus, BookingStatus } from "@prisma/client";
import { CalendarClock, Eye, FileDown, Mail, Pencil, ReceiptText, RefreshCcw, Send, Trash2, Wallet, Copy } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/utils";
import { markAttendance, markPaymentReceived, rescheduleBooking, updateBookingNotes, updatePaymentStatus } from "./actions";

type BookingRow = {
  id: string;
  bookingReference: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  status: BookingStatus;
  attendanceStatus: AttendanceStatus;
  amount: number;
  currency: string;
  notes: string | null;
  registeredAt: string;
  program: { id: string; name: string };
  batch: { id: string; startsAt: string; capacity: number; zoomLink: string | null } | null;
  payment: { transactionId: string; provider: string; amount: number; currency: string; status: BookingStatus; paidAt: string | null } | null;
  emailLogs: Array<{ id: string; subject: string; status: string; sentAt: string; templateName: string | null }>;
};

type BatchOption = {
  id: string;
  label: string;
  available: number;
};

type ColumnSearch = {
  nameSearch: string;
  emailSearch: string;
  phoneSearch: string;
  countrySearch: string;
  programSearch: string;
  batchSearch: string;
  sessionDateSearch: string;
};

export function BookingsTable({
  bookings,
  batches,
  columnSearch,
  preservedParams,
  clearColumnSearchHref
}: {
  bookings: BookingRow[];
  batches: BatchOption[];
  columnSearch: ColumnSearch;
  preservedParams: Array<[string, string]>;
  clearColumnSearchHref: string;
}) {
  const [selected, setSelected] = useState<BookingRow | null>(null);
  const [filters, setFilters] = useState<ColumnSearch>(columnSearch);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const preservedQuery = useMemo(() => preservedParams.map(([name, value]) => [name, value] as [string, string]), [preservedParams]);

  useEffect(() => {
    setFilters(columnSearch);
  }, [columnSearch]);

  const applyFilters = useCallback((nextFilters: ColumnSearch, options?: { force?: boolean }) => {
    const nextParams = new URLSearchParams(preservedQuery);
    Object.entries(nextFilters).forEach(([name, rawValue]) => {
      const value = rawValue.trim();
      if (!value) return;
      if (options?.force || name === "sessionDateSearch" || value.length >= 3) nextParams.set(name, value);
    });

    const nextQuery = nextParams.toString();
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.delete("page");
    const currentQuery = currentParams.toString();
    if (nextQuery !== currentQuery) {
      router.replace(`${pathname}${nextQuery ? `?${nextQuery}` : ""}`, { scroll: false });
    }
  }, [pathname, preservedQuery, router, searchParams]);

  const applyColumnFilter = useCallback((name: keyof ColumnSearch, value: string) => {
    const nextFilters = { ...filters, [name]: value };
    setFilters(nextFilters);
    applyFilters(nextFilters);
  }, [applyFilters, filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      applyFilters(filters);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [applyFilters, filters]);

  return (
    <>
      <div className="overflow-x-auto">
        <div>
          {preservedParams.map(([name, value]) => <input key={`${name}-${value}`} type="hidden" name={name} value={value} />)}
          <Table>
            <TableHeader>
              <TableRow className="align-top">
                <TableHead className="min-w-40">
                  <div className="space-y-2">
                    <span>Booking ID</span>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline"><a href={clearColumnSearchHref}>Clear</a></Button>
                    </div>
                  </div>
                </TableHead>
                <TableHead><ColumnFilter label="Name" name="nameSearch" value={filters.nameSearch} onChange={setFilters} onApply={applyColumnFilter} /></TableHead>
                <TableHead><ColumnFilter label="Email" name="emailSearch" value={filters.emailSearch} onChange={setFilters} onApply={applyColumnFilter} /></TableHead>
                <TableHead><ColumnFilter label="WhatsApp Number" name="phoneSearch" value={filters.phoneSearch} onChange={setFilters} onApply={applyColumnFilter} /></TableHead>
                <TableHead><ColumnFilter label="Country" name="countrySearch" value={filters.countrySearch} onChange={setFilters} onApply={applyColumnFilter} /></TableHead>
                <TableHead><ColumnFilter label="Program" name="programSearch" value={filters.programSearch} onChange={setFilters} onApply={applyColumnFilter} /></TableHead>
                <TableHead><ColumnFilter label="Batch" name="batchSearch" value={filters.batchSearch} onChange={setFilters} onApply={applyColumnFilter} /></TableHead>
                <TableHead><ColumnFilter label="Session Date" name="sessionDateSearch" value={filters.sessionDateSearch} onChange={setFilters} onApply={applyColumnFilter} type="date" /></TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Attendance Status</TableHead>
                <TableHead>Registration Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length ? bookings.map((booking) => (
                <TableRow key={booking.id} className="cursor-pointer" onClick={() => setSelected(booking)}>
                  <TableCell className="font-mono text-xs">{booking.bookingReference}</TableCell>
                  <TableCell className="font-medium">{booking.name}</TableCell>
                  <TableCell>{booking.email}</TableCell>
                  <TableCell>{booking.phone}</TableCell>
                  <TableCell>{booking.country}</TableCell>
                  <TableCell>{booking.program.name}</TableCell>
                  <TableCell>{booking.batch ? booking.batch.id.slice(0, 8) : "Unassigned"}</TableCell>
                  <TableCell>{booking.batch ? formatDate(booking.batch.startsAt) : "Not scheduled"}</TableCell>
                  <TableCell>{booking.payment?.provider ?? "Manual / Pending"}</TableCell>
                  <TableCell>{formatCurrency(booking.amount, booking.currency)}</TableCell>
                  <TableCell><Badge className={paymentBadge(booking.status)}>{paymentLabel(booking.status)}</Badge></TableCell>
                  <TableCell><Badge className={attendanceBadge(booking.attendanceStatus)}>{attendanceLabel(booking.attendanceStatus)}</Badge></TableCell>
                  <TableCell>{formatDate(booking.registeredAt)}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={13} className="h-32 text-center text-sm text-muted-foreground">
                    No bookings found. Adjust the column search or clear the filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        {selected ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selected.name}</DialogTitle>
              <DialogDescription>{selected.bookingReference} • {selected.program.name}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <Section title="Customer Information">
                <Info label="Name" value={selected.name} />
                <Info label="Email" value={selected.email} />
                <Info label="Phone" value={selected.phone} />
                <Info label="Country" value={selected.country} />
              </Section>

              <Section title="Program Information">
                <Info label="Program Name" value={selected.program.name} />
                <Info label="Batch Name" value={selected.batch ? selected.batch.id.slice(0, 8) : "Unassigned"} />
                <Info label="Session Date" value={selected.batch ? formatDate(selected.batch.startsAt) : "Not scheduled"} />
                <Info label="Zoom Link" value={selected.batch?.zoomLink ?? "Not configured"} />
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(selected.batch?.zoomLink ?? "")}><Copy className="h-4 w-4" /> Copy Zoom Link</Button>
                  <Button size="sm" variant="outline"><Send className="h-4 w-4" /> Resend Zoom Link</Button>
                  <Button size="sm" variant="outline"><CalendarClock className="h-4 w-4" /> Calendar Invite</Button>
                </div>
              </Section>

              <Section title="Payment Information">
                <Info label="Transaction ID" value={selected.payment?.transactionId ?? "Not available"} />
                <Info label="Provider" value={selected.payment?.provider ?? "Manual / Pending"} />
                <Info label="Currency" value={selected.payment?.currency ?? selected.currency} />
                <Info label="Amount" value={formatCurrency(selected.payment?.amount ?? selected.amount, selected.payment?.currency ?? selected.currency)} />
                <Info label="Payment Date" value={selected.payment?.paidAt ? formatDate(selected.payment.paidAt) : "Not paid"} />
                <div className="grid gap-2 pt-2 sm:grid-cols-2">
                  <form action={markPaymentReceived.bind(null, selected.id)}><Button className="w-full" size="sm" variant="outline"><Wallet className="h-4 w-4" /> Mark Payment Received</Button></form>
                  <form action={updatePaymentStatus.bind(null, selected.id, "REFUNDED")}><Button className="w-full" size="sm" variant="outline"><RefreshCcw className="h-4 w-4" /> Refund Payment</Button></form>
                </div>
              </Section>

              <Section title="Communication History">
                {selected.emailLogs.length ? selected.emailLogs.map((log) => (
                  <div key={log.id} className="rounded-md border p-3 text-sm">
                    <div className="flex justify-between gap-2"><span className="font-medium">{log.templateName ?? log.subject}</span><Badge>{log.status}</Badge></div>
                    <p className="mt-1 text-muted-foreground">{formatDate(log.sentAt)}</p>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No communication history yet.</p>}
                <div className="grid gap-2 pt-2 sm:grid-cols-3">
                  <Button size="sm" variant="outline"><Mail className="h-4 w-4" /> Confirmation</Button>
                  <Button size="sm" variant="outline"><Mail className="h-4 w-4" /> Reminder</Button>
                  <Button size="sm" variant="outline"><Mail className="h-4 w-4" /> Follow-up</Button>
                </div>
              </Section>

              <Section title="Booking Actions">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button size="sm" variant="outline"><Eye className="h-4 w-4" /> View Details</Button>
                  <Button size="sm" variant="outline"><Pencil className="h-4 w-4" /> Edit Booking</Button>
                  <Button size="sm" variant="outline"><ReceiptText className="h-4 w-4" /> Download Invoice</Button>
                  <form action={updatePaymentStatus.bind(null, selected.id, "CANCELLED")}><Button className="w-full" size="sm" variant="destructive"><Trash2 className="h-4 w-4" /> Cancel Booking</Button></form>
                </div>
              </Section>

              <Section title="Reschedule Batch">
                <form action={rescheduleBooking} className="grid gap-2">
                  <input type="hidden" name="bookingId" value={selected.id} />
                  <select name="batchId" className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={selected.batch?.id ?? ""}>
                    {batches.map((batch) => <option key={batch.id} value={batch.id} disabled={batch.available <= 0}>{batch.label} • {batch.available} seats</option>)}
                  </select>
                  <Button size="sm" variant="accent">Move Participant & Send Updated Invite</Button>
                </form>
              </Section>

              <Section title="Attendance Management">
                <div className="grid gap-2 sm:grid-cols-3">
                  <form action={markAttendance.bind(null, selected.id, selected.batch?.id ?? null, "NOT_MARKED")}><Button className="w-full" size="sm" variant="outline">Not Marked</Button></form>
                  <form action={markAttendance.bind(null, selected.id, selected.batch?.id ?? null, "ATTENDED")}><Button className="w-full" size="sm" variant="outline">Attended</Button></form>
                  <form action={markAttendance.bind(null, selected.id, selected.batch?.id ?? null, "NO_SHOW")}><Button className="w-full" size="sm" variant="outline">No Show</Button></form>
                </div>
              </Section>

              <Section title="Admin Notes">
                <form action={updateBookingNotes} className="grid gap-2">
                  <input type="hidden" name="bookingId" value={selected.id} />
                  <Textarea name="notes" defaultValue={selected.notes ?? ""} placeholder="Requested reschedule, needs follow-up, international participant..." />
                  <Button size="sm" variant="accent">Save Notes</Button>
                </form>
              </Section>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}

function ColumnFilter({
  label,
  name,
  value,
  onChange,
  onApply,
  type = "search"
}: {
  label: string;
  name: keyof ColumnSearch;
  value: string;
  onChange: Dispatch<SetStateAction<ColumnSearch>>;
  onApply: (name: keyof ColumnSearch, value: string) => void;
  type?: "search" | "date";
}) {
  return (
    <div className="min-w-44 space-y-2">
      <span>{label}</span>
      <Input
        type={type}
        name={name}
        value={value}
        onChange={(event) => onChange((current) => ({ ...current, [name]: event.target.value }))}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          onApply(name, event.currentTarget.value);
        }}
        className="h-8 min-w-40 bg-background text-xs font-normal"
        placeholder={type === "date" ? undefined : label}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border bg-card p-4"><h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">{title}</h3><div className="space-y-2">{children}</div></section>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[140px_1fr] gap-3 text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}

function paymentLabel(status: BookingStatus) {
  if (status === "CANCELLED") return "FAILED";
  return status;
}

function paymentBadge(status: BookingStatus) {
  if (status === "PAID") return "border-green-200 bg-green-50 text-green-700";
  if (status === "PENDING") return "border-orange-200 bg-orange-50 text-orange-700";
  if (status === "REFUNDED") return "border-gray-200 bg-gray-50 text-gray-700";
  return "border-red-200 bg-red-50 text-red-700";
}

function attendanceLabel(status: AttendanceStatus) {
  return status.replace("_", " ");
}

function attendanceBadge(status: AttendanceStatus) {
  if (status === "ATTENDED") return "border-green-200 bg-green-50 text-green-700";
  if (status === "NO_SHOW") return "border-red-200 bg-red-50 text-red-700";
  return "border-stone-200 bg-stone-50 text-stone-700";
}
