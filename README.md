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

2. In Supabase Auth settings:

- Enable **Email** provider (password). Leave social providers off.
- Enable **Anonymous Sign-Ins** (for the landing-page “Try it” flow).

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

Email/password via Supabase Auth, plus **anonymous “Try it”** sessions so visitors can use the app before creating an account. No OAuth in v1.

In Supabase → **Authentication → Providers**:

1. Enable **Email** (password).
2. Enable **Anonymous Sign-Ins**.

Anonymous users get a real session and can capture/sort like anyone else. In **Settings**, they can add email + password to convert the same user id into a permanent account (data stays).

If “Try it” fails with a provider error, Anonymous Sign-Ins is usually still off in the project.

## Later

- Morning Digest + Weekly Recap (Vercel Cron / Next.js route handlers)
- AI sorting API (secret key server-side)
- Installable PWA (no React Native / Capacitor yet)
