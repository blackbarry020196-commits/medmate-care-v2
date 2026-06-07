# MedMate Care v2

A simple medication reminder app for elderly users — rebuilt with a clean, maintainable stack.

## Stack

- React + Vite + TypeScript
- Tailwind CSS + shadcn-style UI components
- Supabase (auth + Postgres + RLS)
- React Router + TanStack Query
- Deploy to Vercel (static SPA)

## Quick start

### 1. Create a new Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a **new** project.
2. In **SQL Editor**, run the migration: `supabase/migrations/001_initial.sql`
3. In **Authentication → Providers**, enable Email and **disable email confirmation** (for easier dev testing).
4. Copy your project URL and anon key from **Settings → API**.

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

### 4. Deploy to Vercel

1. Push this repo to GitHub.
2. Import in Vercel as a new project.
3. Add the same `VITE_*` env vars in Vercel project settings.
4. Deploy — `vercel.json` handles SPA routing.

## App flow

1. **Sign up** with name, email, password
2. **Add a medication** (name, dosage, frequency)
3. **Add a reminder** (time + days of week)
4. **Dashboard** shows today's doses — tap **Mark as taken**

## Pages

| Route | Purpose |
|-------|---------|
| `/login` | Sign in |
| `/signup` | Create account |
| `/dashboard` | Today's schedule |
| `/medications` | Manage medications |
| `/reminders` | Manage reminders |
| `/profile` | Account + sign out |

## v1 archive

The previous TanStack Start build is preserved at `../medmate-care-v1`.

## Out of scope (future phases)

- Browser push notifications
- Family member linking
- Prescription photo scanner (AI)
