# iChaitanya Meditation Platform

Production-ready Next.js 15 meditation platform for iChaitanya with a public website, protected admin portal, Prisma ORM, SQLite, analytics, registration management, payment/email logs, email templates, and system configuration.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- ShadCN-style UI components
- Prisma ORM
- SQLite at `prisma/database.db`
- Recharts analytics
- NextAuth credentials authentication

## Quick Start

```bash
npm install
npx prisma generate
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000`.

## Database

The Prisma schema is in `prisma/schema.prisma`.

This workspace also includes `prisma/init.sql` as a fallback initializer for Windows machines where Prisma's schema engine fails to push SQLite schema changes. The generated database file is `prisma/database.db`.

Seed data includes:

- Admin user
- Orientation, Bliss Path, Open Eye Meditation, Walking Meditation, Habit De-addiction Meditation, Aura Night, One-to-One Meditation
- 100 sample bookings
- Payment/revenue data
- Country analytics data
- Testimonials
- Email templates
- System configuration rows

## Admin Modules

Sidebar structure:

- Dashboard
- Bookings
- Orientation Settings
- Programs
- Aura Night
- Testimonials
- Email Templates
- Logs
- Payment Logs
- Email Logs
- Environment Settings
- Server Config
- Tutorial
- Logout

## Public Pages

- `/`
- `/orientation`
- `/bliss-path`
- `/aura-night`
- `/one-to-one`
- `/testimonials`
- `/about`
- `/contact`

## Environment

Copy `.env.example` to `.env` and update secrets for production:

```env
DATABASE_URL="file:./database.db"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
```

Operational Razorpay, PayPal, SMTP, WhatsApp, and website settings are stored in `SystemConfig` and managed in the admin portal.
