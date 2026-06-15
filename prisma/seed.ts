import { PrismaClient, ProgramType, BookingStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const countries = ["India", "United States", "United Kingdom", "Australia", "Canada", "Singapore", "United Arab Emirates", "Malaysia", "Germany", "France", "Netherlands", "Japan", "Sri Lanka", "Nepal"];
const firstNames = ["Aarav", "Diya", "Nikhil", "Meera", "Arjun", "Saanvi", "Rohan", "Anika", "Kabir", "Isha", "Dev", "Tara", "Vihaan", "Maya"];
const lastNames = ["Sharma", "Patel", "Rao", "Misra", "Kapoor", "Iyer", "Mehta", "Menon", "Desai", "Malhotra"];

const programs = [
  ["Orientation", "orientation", ProgramType.ORIENTATION, "A guided 40-minute iChaitanya Dhyan Orientation with Saarthi Umesh Misra.", 199, 30, "Live weekly Zoom batches", "40 min"],
  ["Bliss Path", "bliss-path", ProgramType.BLISS_PATH, "A structured path for immediate freedom from mental clutter and stress.", 999, 99, "6-day guided batch", "6 days"],
  ["Open Eye Meditation", "open-eye-meditation", ProgramType.OPEN_EYE, "Meditation awareness carried into open-eyed everyday life.", 599, 49, "Weekend cohort", "90 min"],
  ["Walking Meditation", "walking-meditation", ProgramType.WALKING, "A calm walking practice for embodied meditative awareness.", 499, 39, "Monthly live session", "60 min"],
  ["Habit De-addiction Meditation", "habit-deaddiction-meditation", ProgramType.HABIT_DEADDICTION, "A compassionate practice to shift recurring habits at the root.", 1499, 129, "4-week live cohort", "4 weeks"],
  ["Aura Night", "aura-night", ProgramType.AURA_NIGHT, "A 10-minute night meditation for calm sleep and a peaceful reset.", 75, 10, "Daily 9:00 PM IST", "10 min"],
  ["One-to-One Meditation", "one-to-one", ProgramType.ONE_TO_ONE, "A private meditative experience for clarity, emotional balance, and stillness.", 2500, 199, "By appointment", "60 min"]
] as const;

async function main() {
  await prisma.paymentLog.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.program.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.contactRequest.deleteMany();
  await prisma.emailTemplate.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.user.deleteMany();
  await prisma.admin.deleteMany();

  const password = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? "admin12345", 12);
  await prisma.admin.create({
    data: { name: "Saarthi Master", email: process.env.ADMIN_EMAIL ?? "admin@ichaitanya.com", password }
  });

  const createdPrograms = [];
  for (const [name, slug, type, description, priceIndia, priceGlobal, schedule, duration] of programs) {
    const program = await prisma.program.create({
      data: { name, slug, type, description, priceIndia, priceGlobal, schedule, duration, zoomLink: "https://zoom.us/j/84212849283" }
    });
    createdPrograms.push(program);
    for (let i = 1; i <= 3; i++) {
      await prisma.batch.create({
        data: {
          programId: program.id,
          startsAt: new Date(Date.now() + (i * 3 + createdPrograms.length) * 24 * 60 * 60 * 1000),
          capacity: type === ProgramType.AURA_NIGHT ? 100 : type === ProgramType.ONE_TO_ONE ? 1 : 30,
          zoomLink: "https://zoom.us/j/84212849283"
        }
      });
    }
  }

  const templates = [
    ["registration_confirmation", "Registration Confirmation", "Your {{program}} registration is received", "Namaste {{name}}, your registration for {{program}} is confirmed for {{date}}."],
    ["payment_confirmation", "Payment Confirmation", "Payment received for {{program}}", "Thank you {{name}}. Your payment for {{program}} has been received."],
    ["reminder_email", "Reminder Email", "Reminder: {{program}} begins soon", "Namaste {{name}}, your {{program}} session starts on {{date}}. Zoom: {{zoom_link}}"],
    ["zoom_invite", "Zoom Invite", "Zoom invite for {{program}}", "Join {{program}} here: {{zoom_link}}"],
    ["follow_up_email", "Follow-up Email", "After your {{program}} session", "Namaste {{name}}, thank you for joining {{program}}. Stay with the calm you touched."]
  ];
  for (const [key, name, subject, body] of templates) {
    await prisma.emailTemplate.create({ data: { key, name, subject, body } });
  }

  await prisma.testimonial.createMany({
    data: [
      { name: "Ritika", country: "India", category: "whatsapp", featured: true, content: "The Bliss Path changed how I handle work stress. Umesh teaches with clarity; calm feels available again." },
      { name: "Daniel", country: "United Kingdom", category: "zoom", featured: true, content: "Aura Night became my daily reset. Ten minutes shifted my bedtime overthinking into genuine rest." },
      { name: "Mei", country: "Singapore", category: "global", featured: true, content: "The orientation was simple, direct, and powerful. I felt a quiet mind without forcing anything." }
    ]
  });

  const registrationTemplate = await prisma.emailTemplate.findUniqueOrThrow({ where: { key: "registration_confirmation" } });
  const paymentTemplate = await prisma.emailTemplate.findUniqueOrThrow({ where: { key: "payment_confirmation" } });

  for (let i = 0; i < 100; i++) {
    const country = countries[i % countries.length];
    const program = createdPrograms[i % createdPrograms.length];
    const batch = await prisma.batch.findFirstOrThrow({ where: { programId: program.id } });
    const name = `${firstNames[i % firstNames.length]} ${lastNames[(i * 3) % lastNames.length]}`;
    const status = i % 10 === 0 ? BookingStatus.CANCELLED : i % 4 === 0 ? BookingStatus.PENDING : BookingStatus.PAID;
    const amount = country === "India" ? program.priceIndia : program.priceGlobal;
    const currency = country === "India" ? "INR" : "USD";
    const registeredAt = new Date(Date.now() - (i % 28) * 24 * 60 * 60 * 1000 - i * 3600 * 1000);

    const user = await prisma.user.upsert({
      where: { email: `student${i + 1}@example.com` },
      create: { name, email: `student${i + 1}@example.com`, phone: `+91${9000000000 + i}`, country },
      update: {}
    });

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        programId: program.id,
        batchId: batch.id,
        name,
        email: user.email,
        phone: user.phone ?? "",
        country,
        status,
        amount,
        currency,
        registeredAt
      }
    });

    await prisma.emailLog.create({
      data: { recipient: booking.email, templateId: registrationTemplate.id, bookingId: booking.id, subject: registrationTemplate.subject, status: "SENT", sentAt: registeredAt }
    });

    if (status === BookingStatus.PAID) {
      const payment = await prisma.payment.create({
        data: {
          bookingId: booking.id,
          provider: country === "India" ? "Razorpay" : "PayPal",
          transactionId: `ICH-${Date.now()}-${i}`,
          amount,
          currency,
          status,
          paidAt: registeredAt
        }
      });
      await prisma.paymentLog.create({
        data: { paymentId: payment.id, transactionId: payment.transactionId, amount, currency, status: "SUCCESS", timestamp: registeredAt }
      });
      await prisma.emailLog.create({
        data: { recipient: booking.email, templateId: paymentTemplate.id, bookingId: booking.id, subject: paymentTemplate.subject, status: "SENT", sentAt: registeredAt }
      });
    }
  }

  const configs: Array<{ key: string; value: string; group: string; secret: boolean }> = [
    { key: "razorpay_key_id", value: "", group: "payments", secret: true },
    { key: "razorpay_key_secret", value: "", group: "payments", secret: true },
    { key: "paypal_client_id", value: "", group: "payments", secret: true },
    { key: "paypal_client_secret", value: "", group: "payments", secret: true },
    { key: "smtp_host", value: "", group: "email", secret: false },
    { key: "smtp_user", value: "", group: "email", secret: true },
    { key: "smtp_password", value: "", group: "email", secret: true },
    { key: "whatsapp_number", value: "+91 92176 39689", group: "website", secret: false },
    { key: "website_title", value: "iChaitanya", group: "website", secret: false },
    { key: "orientation_registration_open", value: "true", group: "orientation", secret: false }
  ];
  for (const config of configs) {
    await prisma.systemConfig.create({ data: config });
  }
}

main().finally(async () => prisma.$disconnect());
