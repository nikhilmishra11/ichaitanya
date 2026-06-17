import type React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const systemModules = [
  ["Orientation Settings", "Bookable 40-minute live orientation slots for India and international tracks. Each slot gets its own auto-generated Zoom meeting.", "Orientation Settings"],
  ["Programs", "Multi-session programs with flexible batch scheduling. Each batch can have a defined date range, weekday schedule, pricing, and an auto-generated Zoom meeting shared across all sessions.", "Programs"],
  ["Bookings", "All orientation enrollment records across both tracks. Filter by status and event. Export CSV.", "Bookings"],
  ["Payment Logs", "Full audit trail of every payment event: captures, webhooks, failures, and gateway responses.", "Payment Logs"],
  ["Email Templates", "Edit the body of automated emails sent to students for orientations.", "Email Templates"],
  ["Server Config", "PayPal and Razorpay credentials and mode switches. Facebook Pixel configuration.", "Server Config"]
];

const orientationFields = [
  ["Date & Time", "When the orientation session is scheduled. Used to generate the Zoom meeting and all reminder timings."],
  ["Timezone", "Displayed to the student and used to calculate reminder fire times. Set to Asia/Kolkata for India, UTC or the relevant timezone for international."],
  ["Max Seats", "Caps how many paid bookings are accepted. Set to 0 for unlimited."],
  ["Status", "Active = visible and bookable. Inactive = hidden from students. Cancelled = slot is off."],
  ["Zoom Meeting", "Auto-generated when the slot is saved. The join URL is included in confirmation and reminder emails."]
];

const orientationEmailFlow = [
  ["Confirmation", "Immediately after payment for the orientation", "Booking confirmation with slot date, time, and Zoom link"],
  ["3 days before", "Cron job fires 3 days before the slot time", "Reminder with session details and Zoom link"],
  ["1 day before", "Cron job fires 1 day before the slot time", "Reminder with session details and Zoom link"],
  ["1 hour before", "Cron job fires 1 hour before the slot time", "Final reminder with Zoom link"]
];

const batchFields = [
  ["Batch Name", "Shown to students on the registration form, for example: Morning / Weekend."],
  ["International Price (USD) / India Price (INR)", "Per-batch pricing. Supports free batches too; set to 0."],
  ["Max Seats", "Caps paid enrollments per batch. Set to 0 for unlimited."],
  ["Start Date / End Date", "The date range sessions are generated within."],
  ["Timezone", "Applied to all sessions in the batch and used to time reminder emails."],
  ["Status", "Active = visible and bookable. Inactive or Closed = not shown."],
  ["Zoom Meeting", "One meeting is auto-created per batch and reused as the join link for every session of that batch."]
];

const programEmailFlow = [
  ["Confirmation", "Immediately after payment", "Booking confirmation with batch name, schedule summary, and Zoom link"],
  ["Zoom link follow-up", "2 hours after payment", "Sends details again with the Zoom join link and full session schedule"],
  ["Per-session reminders", "3 days before, 2 days before, and 1 hour before each individual session", "Session-specific reminder with the upcoming session date/time and Zoom link"]
];

const emailTemplates = [
  ["Orientation Confirmation", "Immediately after orientation booking is confirmed", "{{NAME}}, {{DATE}}, {{TIME}}, {{ZOOM_LINK}}"],
  ["Orientation Reminder", "Based on the orientation reminder schedule", "{{NAME}}, {{DATE}}, {{TIME}}, {{ZOOM_LINK}}"]
];

const serverConfigRows = [
  ["PayPal Mode", "Switch between sandbox and live.", "Use sandbox while testing. Switch to live for real transactions."],
  ["PayPal Client Credentials", "Client ID, Client Secret, Webhook ID from your PayPal live app.", "Active when mode is live. Used for international non-India payments."],
  ["PayPal Sandbox Credentials", "Client ID, Client Secret, Webhook ID from your PayPal sandbox app.", "Active when mode is sandbox. Safe for testing without real money."],
  ["Razorpay Mode", "Switch between test and live.", "Use test while verifying the India checkout flow. Switch to live for production."],
  ["Razorpay Live Credentials", "Key ID and Key Secret from your Razorpay live account.", "Active when Razorpay mode is live. Used for Indian students across all modules."],
  ["Razorpay Test Credentials", "Key ID and Key Secret from your Razorpay test account.", "Active when Razorpay mode is test. No real charges."]
];

const pixelFields = [
  ["Global Fallback", "Any page without its own pixel config."],
  ["Homepage", "The / homepage only."],
  ["Thank-you", "Site-wide tracking when no page-specific config is defined."]
];

const troubleshooting = [
  ["An orientation slot is not showing on the homepage", "Confirm the slot status is Active and the slot date is in the future."],
  ["A program registration page is not accessible", "Make sure the program status is Active and at least one batch is active."],
  ["Students are not seeing correct session details in emails", "Review the event date, time, and timezone on the relevant slot or program batch."],
  ["Reminder emails are not arriving", "Confirm the reminder processing cron job is running."],
  ["Program students are not receiving per-session reminders", "Confirm the enrollment was processed successfully and reminders were scheduled."],
  ["Paid students cannot complete checkout", "Check Payment Logs for the error. Verify PayPal/Razorpay credentials and mode in Server Config."],
  ["Indian students see PayPal instead of Razorpay", "Confirm the India Price (INR) is set above 0 on the program batch. If the India price is zero, the system falls back to PayPal."],
  ["Razorpay payments failing in production", "Set Server Config mode to Live and make sure live key ID and key secret are correct."],
  ["A Zoom link is missing from a confirmation email", "Check whether Zoom meeting creation succeeded when the slot or batch was saved. Re-save the record after verifying Zoom credentials."],
  ["Facebook Pixel is not firing on a page", "Open Facebook Pixel Settings and confirm a config exists for that page, the correct pixel ID is entered, and the config is enabled."]
];

export default function TutorialPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-serif text-4xl font-bold">Tutorial: Admin Panel Guide</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A practical reference for every module: orientation, programs, email flows, and system configuration.
        </p>
      </header>

      <GuideSection eyebrow="What This System Handles">
        <p className="text-sm leading-6 text-muted-foreground">
          This admin panel runs two types of student journeys from one place. Each has its own enrollment page,
          pricing, Zoom meeting, reminder schedule, and enrollment list.
        </p>
        <GuideTable headers={["Module", "What It Is", "Sidebar Link"]} rows={systemModules} />
      </GuideSection>

      <GuideSection eyebrow="Orientation Settings">
        <p className="text-sm leading-6">
          Go to <strong>Orientation Settings</strong> to manage the live 40-minute orientation. There are two
          independent tracks: <strong>Indian Orientation</strong> (INR, Asia/Kolkata) and{" "}
          <strong>Non-Indian Orientation</strong> (USD, UTC). Each track has its own pricing defaults, bookable
          slots, and Zoom meetings.
        </p>
        <TwoColumns>
          <InstructionCard title="Orientation Pricing Defaults">
            <ul className="list-disc space-y-2 pl-5 text-sm">
              <li>Set the <strong>India Price (INR)</strong> for the Indian track and the <strong>International Price (USD)</strong> for the non-Indian track.</li>
              <li>Pricing defaults apply to all new enrollments for that track.</li>
              <li>Set price to <strong>0</strong> to make the orientation free.</li>
            </ul>
          </InstructionCard>
          <InstructionCard title="Adding Orientation Slots">
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              <li>Under the relevant track, click <strong>Add Slot</strong>.</li>
              <li>Set date, time, timezone, max seats, and status.</li>
              <li>Save. A Zoom meeting is created automatically.</li>
              <li>The slot immediately appears as bookable on the homepage enrollment form for students in that track.</li>
            </ol>
          </InstructionCard>
        </TwoColumns>
        <GuideTable headers={["Slot Field", "What It Controls"]} rows={orientationFields} />
        <p className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          Once a slot has paid bookings, its date, time, and timezone cannot be changed. Create a new slot instead.
          The slot will auto-close when max seats are filled.
        </p>
      </GuideSection>

      <GuideSection eyebrow="Orientation Email Flow">
        <GuideTable headers={["Stage", "Trigger", "What the Student Receives"]} rows={orientationEmailFlow} />
      </GuideSection>

      <GuideSection eyebrow="Programs">
        <p className="text-sm leading-6">
          Go to <strong>Programs</strong> to create multi-session programs. For example, a program that runs every
          Monday and Wednesday for a month. Each program has a public registration page at{" "}
          <code className="rounded bg-muted px-1 py-0.5">/programs/[slug]</code> and supports multiple named batches
          with independent pricing and schedules.
        </p>
        <TwoColumns>
          <InstructionCard title="Creating a Program">
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              <li>Click <strong>Create Program</strong>.</li>
              <li>Fill in program name, description, and status.</li>
              <li>Choose the <strong>Course Type</strong>: recurring weekly/repeats on selected weekdays, or short term fixed individual dates.</li>
              <li>Add one or more <strong>Batches</strong>. Each batch has its own name, price, date range, schedule, and max seats.</li>
              <li>For each batch, add the session schedule rows.</li>
              <li>Save. A Zoom meeting is automatically created for each batch.</li>
              <li>Set the program to <strong>Active</strong> and share the registration page link.</li>
            </ol>
          </InstructionCard>
          <InstructionCard title="Batch Fields">
            <GuideTable headers={["Field", "Notes"]} rows={batchFields} compact />
          </InstructionCard>
        </TwoColumns>
        <p className="rounded-lg border border-accent/20 bg-accent/5 p-4 text-sm font-medium">
          Important: batches cannot be changed after any student has enrolled. Create a new program or batch instead.
        </p>
      </GuideSection>

      <GuideSection eyebrow="Program Email Flow">
        <GuideTable headers={["Stage", "Trigger", "What the Student Receives"]} rows={programEmailFlow} />
        <p className="text-sm text-muted-foreground">
          Reminders are scheduled per session at enrollment time. A student enrolled in a 10-session batch will receive
          up to 31 reminder emails across the full run: Zoom link plus 3 reminders per session.
        </p>
      </GuideSection>

      <GuideSection eyebrow="Bookings">
        <p className="text-sm leading-6">Go to <strong>Bookings</strong> to view all orientation enrollment records.</p>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>Each row shows student name, email, country, WhatsApp number, slot, payment status, and enrollment date.</li>
          <li>Use <strong>Export CSV</strong> to download the filtered list for external use.</li>
          <li>Program enrollments are accessed from within the Programs module pages through <strong>View Enrollments</strong>.</li>
        </ul>
      </GuideSection>

      <GuideSection eyebrow="Payment Logs">
        <p className="text-sm leading-6">Go to <strong>Payment Logs</strong> to review the complete audit trail of payment events across all modules.</p>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>Each entry records the event type, payment gateway, capture status, payment ID, captured amount, webhook received, gateway amount, currency, and status.</li>
          <li>Use filters to narrow by status, gateway, PayPal/Razorpay, or enrollment type.</li>
          <li>If a student reports a failed payment, check here first. The log shows whether capture succeeded, failed, or is still pending.</li>
          <li>Status: <strong>Completed</strong> means payment fully processed. <strong>Failed</strong> means gateway returned an error. <strong>Pending/In Progress</strong> means capture started but not confirmed. <strong>Mixed Issues</strong> means some steps succeeded and some did not.</li>
        </ul>
      </GuideSection>

      <GuideSection eyebrow="Email Templates">
        <p className="text-sm leading-6">
          Go to <strong>Email Templates</strong> to edit the body content of automated emails sent to students for the
          orientation flow. Each template has a fixed trigger but an editable body.
        </p>
        <GuideTable headers={["Template", "When It Sends", "Available Placeholders"]} rows={emailTemplates} />
        <p className="text-sm text-muted-foreground">
          Program emails like confirmation, Zoom link, and per-session reminders use built-in templates and are not
          editable from this screen.
        </p>
      </GuideSection>

      <GuideSection eyebrow="Server Config: Payment Gateways">
        <p className="text-sm leading-6">
          Go to <strong>Server Config</strong> to manage PayPal and Razorpay credentials. Changes take effect
          immediately without editing the server directly.
        </p>
        <GuideTable headers={["Section", "What To Set", "When It Applies"]} rows={serverConfigRows} />
        <p className="text-sm text-muted-foreground">
          PayPal handles international non-India students. Razorpay handles Indian students. Both gateways can be in
          test/sandbox mode independently. Gateway selection is automatic based on the student country at checkout.
        </p>
      </GuideSection>

      <GuideSection eyebrow="Server Config: Facebook Pixel Settings">
        <p className="text-sm leading-6">
          Go to <strong>Server Config - Facebook Pixel Settings</strong> to attach Meta Pixels to specific public pages
          without touching code.
        </p>
        <TwoColumns>
          <InstructionCard title="How Page-Specific Pixels Work">
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              <li>Each configuration maps one Pixel ID to one page.</li>
              <li>Supported pages: Homepage or Global Fallback for all other pages.</li>
              <li>If no page-specific config exists, the Global Fallback pixel fires instead.</li>
              <li>Configurations can be enabled or disabled without deleting them.</li>
            </ol>
          </InstructionCard>
          <InstructionCard title="Adding A Pixel Configuration">
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              <li>Click <strong>Add Landing Page Config</strong>.</li>
              <li>Choose the type: Global Fallback or Homepage.</li>
              <li>Enter the Facebook Pixel ID.</li>
              <li>Select which events the pixel should fire.</li>
              <li>Check <strong>Enable this pixel configuration</strong> and save.</li>
            </ol>
          </InstructionCard>
        </TwoColumns>
        <GuideTable headers={["Page Type", "When It Fires", "Typical Use"]} rows={pixelFields} />
        <p className="text-sm text-muted-foreground">
          Thank-you pages retain their own purchase tracking and are not affected by these page configs. The
          page-specific config always takes priority over the global fallback.
        </p>
      </GuideSection>

      <GuideSection eyebrow="Operational Notes">
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>Reminder emails are sent by the cron script. If reminders are not arriving, confirm the job is running on schedule.</li>
          <li>Zoom meetings are created automatically when an orientation slot or program batch is saved. If Zoom credentials are missing or invalid, the record is saved without a Zoom link and a warning is logged.</li>
          <li>To stop accepting new enrollments, change the record status to <strong>Closed</strong> or <strong>Inactive</strong> instead of deleting it. Deleting removes all associated enrollment history.</li>
          <li>Orientation slot date, time, and timezone cannot be changed after paid bookings exist. Create a new slot instead.</li>
          <li>Program batches cannot be changed after any student enrolls. Create a new program or batch instead.</li>
        </ul>
      </GuideSection>

      <GuideSection eyebrow="Troubleshooting Guide">
        <GuideTable headers={["If This Happens", "Check This First"]} rows={troubleshooting} />
      </GuideSection>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline"><Link href="/admin/orientation-settings">Open Orientation Settings</Link></Button>
        <Button asChild variant="outline"><Link href="/admin/programs">Open Programs</Link></Button>
        <Button asChild variant="outline"><Link href="/admin/bookings">Open Bookings</Link></Button>
        <Button asChild variant="outline"><Link href="/admin/logs/payment">Open Payment Logs</Link></Button>
        <Button asChild variant="outline"><Link href="/admin/environment-settings/server-config">Open Server Config</Link></Button>
      </div>
    </div>
  );
}

function GuideSection({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>
        <CardTitle className="sr-only">{eyebrow}</CardTitle>
        <CardDescription className="sr-only">Admin panel guide section</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

function TwoColumns({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 lg:grid-cols-2">{children}</div>;
}

function InstructionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function GuideTable({ headers, rows, compact = false }: { headers: string[]; rows: string[][]; compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-accent/10 text-xs uppercase tracking-widest text-primary">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${row[0]}-${rowIndex}`} className="border-t">
              {row.map((cell, index) => (
                <td key={`${row[0]}-${index}`} className={`${compact ? "px-3 py-2" : "px-4 py-3"} align-top ${index === 0 ? "font-medium text-primary" : "text-muted-foreground"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
