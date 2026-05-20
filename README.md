# XO Expense Tracker

> Split shared expenses effortlessly — across rooms, across devices, with or without an account.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

---

## Overview

XO Expense Tracker is a full-stack web application for tracking and splitting shared expenses within groups. Organize spending by room, invite collaborators, monitor live balances, and settle up — no account required to get started.

**Key highlights:**

- **Rooms** — Create a shared space for any group: flatmates, trips, events, or projects.
- **Invite flows** — Share a room code or invite link; members join in seconds.
- **Real-time balances** — See who owes what at a glance, updated on every transaction.
- **Chat** — Communicate with room members directly inside the app.
- **Guest mode** — Start tracking immediately without signing up; upgrade to a full account any time.
- **Supabase Auth** — Full authentication with email/password; rooms are securely tied to your account.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI Library | [React 19](https://react.dev/) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| Auth & Database | [Supabase](https://supabase.com/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Components | [Radix UI](https://www.radix-ui.com/) |

---

## Project Structure

```
.
├── app/
│   ├── auth/
│   │   ├── callback/route.ts   # Supabase auth code exchange
│   │   ├── login/page.tsx      # Email/password sign-in
│   │   └── signup/page.tsx     # New user registration
│   └── dashboard/page.tsx      # Main dashboard (auth + guest fallback)
├── lib/
│   └── supabase/
│       ├── client.ts           # Browser-side Supabase client + guest helpers
│       ├── server.ts           # Server-side Supabase client
│       └── middleware.ts       # Session refresh + route protection
├── middleware.ts                # Root middleware entry point
├── .env.example                 # Environment variable template
└── .env.local                   # Local secrets (git-ignored)
```

---

## Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- A [Supabase](https://supabase.com/) project

### 1. Clone the repository

```bash
git clone https://github.com/bharath-mp-2005/p2p-expense-tracker.git
cd p2p-expense-tracker
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Copy the example environment file and fill in your Supabase credentials:

```bash
Copy-Item .env.example .env.local
```

On macOS or Linux, the equivalent command is:

```bash
cp .env.example .env.local
```

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> Your Supabase URL and anon key are available in your project's **Settings → API** page.  
> Never commit `.env.local` or any secret keys to version control.

### 4. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Auth Architecture

Authentication is handled by Supabase and wired across both client and server contexts.

| File | Role |
|---|---|
| `lib/supabase/client.ts` | Browser Supabase client; guest-user helper utilities |
| `lib/supabase/server.ts` | Server Supabase client for route handlers and server components |
| `lib/supabase/middleware.ts` | Refreshes sessions; protects routes that require authentication |
| `middleware.ts` | Root middleware entry; applies session logic to matching routes |
| `app/auth/callback/route.ts` | Exchanges the Supabase auth code for a session after OAuth/magic link |
| `app/auth/login/page.tsx` | Email and password sign-in page |
| `app/auth/signup/page.tsx` | New user registration; stores profile data in Supabase |
| `app/dashboard/page.tsx` | Checks for an active session; falls back to guest mode if none found |

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the development server with hot reload |
| `pnpm build` | Create an optimized production build |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint across the codebase |

---

## Deployment

This app is ready to deploy on [Vercel](https://vercel.com/) or any platform that supports Next.js.

### Vercel (recommended)

1. Push your code to GitHub.
2. Import the repository in the [Vercel dashboard](https://vercel.com/new).
3. Add the required environment variables in **Project Settings → Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

4. Deploy. Vercel handles the rest.

> If you have previously committed any secrets to a public repository, **rotate your Supabase keys immediately** before redeploying.

---

## Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a pull request.

---

## Repository

**GitHub:** [bharath-mp-2005/p2p-expense-tracker](https://github.com/bharath-mp-2005/p2p-expense-tracker)

To reinitialize in a new folder:

```bash
git init
git branch -M main
git remote add origin https://github.com/bharath-mp-2005/p2p-expense-tracker.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## License

This project is private. All rights reserved.