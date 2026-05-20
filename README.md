# XO Expense Tracker

XO Expense Tracker is a Next.js app for splitting expenses across shared rooms. It supports both guest users and Supabase-authenticated users, with rooms, invites, balances, transactions, members, and chat.

## What It Does

- Create or join expense rooms with a room code.
- Track balances, transactions, and member activity.
- Use guest mode without signing up.
- Sign up or log in with Supabase Auth to keep rooms tied to a real account.
- Invite people into a room through shareable invite flows.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Supabase Auth + Supabase database access
- Tailwind CSS
- Radix UI components

## Supabase Auth Map

The auth flow is already wired in these files:

- [Browser Supabase client](lib/supabase/client.ts) - browser-side Supabase client and guest-user helpers.
- [Server Supabase client](lib/supabase/server.ts) - server-side Supabase client for route handlers and server components.
- [Session middleware](lib/supabase/middleware.ts) - refreshes sessions and protects routes that need a logged-in user.
- [Root middleware entry](middleware.ts) - runs the session update logic for matching requests.
- [Auth callback route](app/auth/callback/route.ts) - exchanges the Supabase auth code for a session.
- [Login page](app/auth/login/page.tsx) - signs users in with email and password.
- [Signup page](app/auth/signup/page.tsx) - creates new users and stores profile data.
- [Dashboard](app/dashboard/page.tsx) - checks for an active session and falls back to a guest user.

## Environment Variables

Copy [.env.example](.env.example) to [.env.local](.env.local) and fill in your Supabase values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Do not commit [.env.local](.env.local) or any secret keys.

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Start the app:

```bash
pnpm dev
```

3. Open the app in your browser and test guest mode, login, and signup.

## Available Scripts

- `pnpm dev` - start the development server.
- `pnpm build` - create a production build.
- `pnpm start` - start the production server.
- `pnpm lint` - run ESLint.

## GitHub Repo Setup

The project has already been initialized and pushed to:

https://github.com/bharath-mp-2005/p2p-expense-tracker.git

If you need to repeat the process in a new folder, use:

```bash
git init
git branch -M main
git remote add origin https://github.com/bharath-mp-2005/p2p-expense-tracker.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

If GitHub asks for authentication, sign in with your GitHub account or use a personal access token if required by your Git setup.

## Recommended GitHub Description

Shared expense tracker built with Next.js and Supabase for rooms, invites, balances, transactions, and chat.

## Deployment Notes

If you deploy to Vercel or another host, make sure these environment variables are added there too:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Notes

- `.env*.local` is ignored in [.gitignore](.gitignore), so local secrets stay out of git.
- The app includes both authenticated flows and guest-user fallback flows.
- If you already pushed secrets anywhere public, rotate them before pushing again.
