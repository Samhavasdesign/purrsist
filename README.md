# Purrsist

Web-first habit and day-sorting app built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Stack

- **Next.js** (App Router) — UI, API routes, and scheduled cron jobs
- **TypeScript** + **Tailwind CSS**
- **Supabase** — Postgres + email/password auth

## Getting started

1. Copy env vars and fill in your Supabase project values:

```bash
cp .env.example .env.local
```

From Supabase → **Project Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; used later for cron / AI routes)

2. In Supabase Auth settings, enable **Email** provider (password). Leave social providers off.

3. Set the Site URL / redirect URLs to include:

- `http://localhost:3000`
- `http://localhost:3000/auth/callback`

4. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project layout

- `src/app` — App Router pages and API routes
- `src/lib/supabase` — browser, server, and middleware clients
- `src/middleware.ts` — session refresh + auth redirects
- `src/components` — shared UI

## Auth

Email/password only via Supabase Auth. No OAuth in v1.

## Later

- Morning Digest + Weekly Recap (Vercel Cron / Next.js route handlers)
- AI sorting API (secret key server-side)
- Installable PWA (no React Native / Capacitor yet)
