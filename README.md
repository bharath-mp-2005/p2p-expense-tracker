# XO Expense Tracker

XO is a Next.js app for shared rooms, expenses, members, invites, and chat. It uses Supabase for authentication and database access.

## Supabase auth map

The app already has Supabase auth wired in these places:

- [Browser Supabase client](lib/supabase/client.ts) - creates the client used in the browser.
- [Server Supabase client](lib/supabase/server.ts) - creates a server-side client for route handlers and server components.
- [Session middleware](lib/supabase/middleware.ts) - refreshes the session and redirects unauthenticated users when needed.
- [Root middleware entry](middleware.ts) - runs the session update logic for matching routes.
- [Auth callback route](app/auth/callback/route.ts) - exchanges the Supabase auth code for a session.
- [Login page](app/auth/login/page.tsx) - signs users in with email and password.
- [Signup page](app/auth/signup/page.tsx) - creates new users with Supabase Auth and stores profile data.
- [Dashboard](app/dashboard/page.tsx) - checks for an active session and falls back to a guest user.

If you were adding Supabase auth to a project that did not already have it, the minimum pieces are:

1. Install the Supabase packages.
2. Create browser and server clients.
3. Add login and signup pages.
4. Add a callback route for OAuth or email-link flows.
5. Add middleware to keep sessions fresh.
6. Add the Supabase environment variables.

## Environment variables

Create a `.env.local` file with your Supabase values:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Run locally

```bash
pnpm install
pnpm dev
```

## Commit and push to GitHub

1. Open a terminal in the project root.
2. Check what changed:

```bash
git status
```

3. Stage the README:

```bash
git add README.md
```

4. Create a commit:

```bash
git commit -m "Add README and Supabase auth notes"
```

5. Push to GitHub:

```bash
git push origin main
```

If your branch is not `main`, replace it with your current branch name.

## Notes

- Do not commit `.env.local` or any secret keys.
- If you have already pushed secrets, rotate them before pushing again.