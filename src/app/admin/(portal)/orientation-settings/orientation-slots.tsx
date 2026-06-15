"use client";

import { AttendanceStatus } from "@prisma/client";
import { CalendarClock, Copy, Download, Mail, MessageCircle, Pencil, RefreshCcw, Send, Users } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { duplicateSlot, markOrientationAttendance, moveRegistrationToSlot, updateSlotAutomation, updateSlotStatus } from "./actions";

type Registration = {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  paymentStatus: string;
  attendanceStatus: AttendanceStatus;
  amount: number;
  currency: string;
};

type Slot = {
  id: string;
  date: string;
  endTime: string;
  timezone: string;
  status: string;
  seatCap: number;
  zoomLink: string;
  zoomMeetingId: string;
  zoomPassword: string;
  registered: number;
  paid: number;
  pending: number;
  attendanceCount: number;
  noShowCount: number;
  waitlistCount: number;
  registrations: Registration[];
  automations: {
    autoConfirmation: boolean;
    reminder24h: boolean;
    reminder1h: boolean;
    followUp: boolean;
  };
};

type BatchOption = { id: string; label: string; available: number };

export function OrientationSlots({ slots, batchOptions }: { slots: Slot[]; batchOptions: BatchOption[] }) {
  const [selected, setSelected] = useState<Slot | null>(null);

  if (!slots.length) {
    return (
      <Card>
        <CardContent className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
          <p className="font-semibold">No orientation slots yet</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">Generate your first orientation slot using the form above.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {slots.map((slot) => {
          const filled = slot.seatCap ? Math.round((slot.registered / slot.seatCap) * 100) : 0;
          const available = Math.max(slot.seatCap - slot.registered, 0);
          return (
            <Card key={slot.id}>
              <CardContent className="space-y-5 p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-serif text-2xl font-bold">{formatDate(slot.date)}</h2>
                      <Badge className={statusBadge(slot.status)}>{slot.status}</Badge>
                      {available === 0 ? <Badge className="border-red-200 bg-red-50 text-red-700">Waitlist {slot.waitlistCount}</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{new Date(slot.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} - {slot.endTime || "End time not set"} • {slot.timezone}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Meeting ID: {slot.zoomMeetingId || "Not set"} • Password: {slot.zoomPassword || "Not set"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="accent" onClick={() => setSelected(slot)}><Users className="h-4 w-4" /> View Registrations</Button>
                    <Button size="sm" variant="outline"><Pencil className="h-4 w-4" /> Edit Slot</Button>
                    <form action={duplicateSlot.bind(null, slot.id)}><Button size="sm" variant="outline"><RefreshCcw className="h-4 w-4" /> Duplicate</Button></form>
                    <form action={updateSlotStatus.bind(null, slot.id, "Cancelled")}><Button size="sm" variant="outline">Cancel</Button></form>
                    <form action={updateSlotStatus.bind(null, slot.id, "Completed")}><Button size="sm" variant="outline">Complete</Button></form>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-5">
                  <Mini label="Registered" value={slot.registered} />
                  <Mini label="Paid" value={slot.paid} />
                  <Mini label="Pending" value={slot.pending} />
                  <Mini label="Available" value={available} />
                  <Mini label="Attendance" value={slot.attendanceCount} />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{slot.registered} / {slot.seatCap} Seats Filled</span>
                    <span className="text-muted-foreground">{filled}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full ${capacityColor(filled)}`} style={{ width: `${Math.min(filled, 100)}%` }} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline"><Mail className="h-4 w-4" /> Send Confirmation</Button>
                  <Button size="sm" variant="outline"><Mail className="h-4 w-4" /> Send Reminder</Button>
                  <Button size="sm" variant="outline"><MessageCircle className="h-4 w-4" /> WhatsApp Reminder</Button>
                  <Button size="sm" variant="outline"><Send className="h-4 w-4" /> Send Zoom Link</Button>
                  <Button size="sm" variant="outline">Bulk Send</Button>
                  <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(slot.zoomLink)}><Copy className="h-4 w-4" /> Copy Zoom</Button>
                  <Button asChild size="sm" variant="outline"><a href={`/api/orientation/slots/${slot.id}/participants`}><Download className="h-4 w-4" /> Export Participants</a></Button>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="mb-3 text-sm font-semibold">Calendar Integration</p>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline"><a target="_blank" href={googleCalendarLink(slot)}>Google Calendar</a></Button>
                      <Button asChild size="sm" variant="outline"><a target="_blank" href={outlookCalendarLink(slot)}>Outlook Calendar</a></Button>
                      <Button asChild size="sm" variant="outline"><a href={`/api/orientation/slots/${slot.id}/ics`}><CalendarClock className="h-4 w-4" /> ICS File</a></Button>
                    </div>
                  </div>
                  <form action={updateSlotAutomation} className="rounded-lg border p-4">
                    <input type="hidden" name="batchId" value={slot.id} />
                    <p className="mb-3 text-sm font-semibold">Automation Settings</p>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <Toggle name="autoConfirmation" label="Confirmation Immediately" checked={slot.automations.autoConfirmation} />
                      <Toggle name="reminder24h" label="Reminder 24 Hours Before" checked={slot.automations.reminder24h} />
                      <Toggle name="reminder1h" label="Reminder 1 Hour Before" checked={slot.automations.reminder1h} />
                      <Toggle name="followUp" label="Follow-up After Session" checked={slot.automations.followUp} />
                    </div>
                    <Button size="sm" variant="accent" className="mt-3">Save Automations</Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        {selected ? (
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Registrations</DialogTitle>
              <DialogDescription>{formatDate(selected.date)} • {selected.registered} participants</DialogDescription>
            </DialogHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>WhatsApp</TableHead><TableHead>Country</TableHead><TableHead>Payment</TableHead><TableHead>Attendance</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {selected.registrations.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.name}</TableCell>
                      <TableCell>{booking.email}</TableCell>
                      <TableCell>{booking.phone}</TableCell>
                      <TableCell>{booking.country}</TableCell>
                      <TableCell><Badge>{booking.paymentStatus}</Badge><p className="mt-1 text-xs text-muted-foreground">{formatCurrency(booking.amount, booking.currency)}</p></TableCell>
                      <TableCell><Badge>{booking.attendanceStatus.replace("_", " ")}</Badge></TableCell>
                      <TableCell>
                        <div className="grid min-w-56 gap-2">
                          <div className="flex gap-2">
                            <form action={markOrientationAttendance.bind(null, booking.id, selected.id, "ATTENDED")}><Button size="sm" variant="outline">Attended</Button></form>
                            <form action={markOrientationAttendance.bind(null, booking.id, selected.id, "NO_SHOW")}><Button size="sm" variant="outline">No Show</Button></form>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">Resend Email</Button>
                            <form action={moveRegistrationToSlot} className="flex gap-2">
                              <input type="hidden" name="bookingId" value={booking.id} />
                              <select name="batchId" className="h-9 rounded-md border bg-background px-2 text-xs">
                                {batchOptions.map((batch) => <option key={batch.id} value={batch.id} disabled={batch.available <= 0}>{batch.label} • {batch.available}</option>)}
                              </select>
                              <Button size="sm" variant="outline">Move</Button>
                            </form>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>;
}

function Toggle({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return <label className="flex items-center gap-2"><input name={name} type="checkbox" defaultChecked={checked} /> {label}</label>;
}

function capacityColor(filled: number) {
  if (filled > 90) return "bg-red-500";
  if (filled >= 70) return "bg-orange-500";
  return "bg-green-600";
}

function statusBadge(status: string) {
  if (status === "Active") return "border-green-200 bg-green-50 text-green-700";
  if (status === "Full") return "border-red-200 bg-red-50 text-red-700";
  if (status === "Cancelled") return "border-gray-200 bg-gray-50 text-gray-700";
  if (status === "Completed") return "border-primary/20 bg-primary/10 text-primary";
  return "border-orange-200 bg-orange-50 text-orange-700";
}

function googleCalendarLink(slot: Slot) {
  const start = formatCalendarDate(new Date(slot.date));
  const end = formatCalendarDate(new Date(new Date(slot.date).getTime() + 40 * 60 * 1000));
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=iChaitanya%20Orientation&dates=${start}/${end}&details=${encodeURIComponent(slot.zoomLink)}&location=${encodeURIComponent(slot.zoomLink)}`;
}

function outlookCalendarLink(slot: Slot) {
  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=iChaitanya%20Orientation&body=${encodeURIComponent(slot.zoomLink)}&location=${encodeURIComponent(slot.zoomLink)}`;
}

function formatCalendarDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}
