# Weight Log for roohanamin.com

A Next.js app with passwordless email sign-in, private per-user weight entries, and an iPhone-installable PWA. Entries are ordered by measurement date descending, then creation time and ID descending.

## Run locally

Requires Node.js 22 or later.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

The app is at http://localhost:3000. Configure Supabase as below for real accounts.
http://localhost:3000/preview is an interactive sample-data preview **only in development**; production returns 404. Samples are never stored in a real account.

## Supabase setup

1. Create a Supabase project.
2. Apply `supabase/migrations/202610050001_weight_entries.sql` in its SQL Editor (or through the Supabase CLI). The migration creates a new table and its RLS policies; run it once.
3. Set the project URL and **publishable** key in `.env.local` and Vercel. A legacy anon key also works. Never use a service-role/secret key in a public environment variable.
4. Set `NEXT_PUBLIC_SITE_URL=https://roohanamin.com` in production.
5. In Authentication → URL Configuration, set the Site URL to `https://roohanamin.com`, and add `https://roohanamin.com/auth/callback` to Redirect URLs. Add only the actual preview or localhost callback URLs you need for testing.
6. Enable the Email provider and allow new-user signup.
7. **Configure a production SMTP provider before allowing public users.** Supabase's default mail service is restricted and is not suitable for sending sign-in links to arbitrary visitors. Verify the sending domain and test delivery, spam folders, expired links, and rate limits.
8. Set Email OTP Length to **6**. Customize both the Magic Link and Confirm Signup email templates with a code (and optionally a fallback link):

```html
<h2>Your Weight Log sign-in code: {{ .Token }}</h2>
<p>
  Return to Weight Log and enter this code. If you installed the app on your
  iPhone, enter it inside the app.
</p>
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email"
  >Sign in to Weight Log</a
>
```

The standard PKCE callback is also supported at `/auth/callback`, but default links should be opened in the browser where the login was requested. The token-hash template avoids that limitation.

## Vercel deployment

This repository originally put the app in `roohanamin.com/`; that directory is preserved.

- Existing project: `roohanamin-com-jrum` in `roohan-amins-projects`.
- Root Directory: `roohanamin.com`.
- Framework Preset: Next.js.
- Build command: `npm run build`.
- Output directory: use the Next.js default (do not override).
- Node.js: 22 or later.
- Environment variables: the three values in `.env.example`, in the relevant deployment environment.
- Apply the database migration and configure authentication before production rollout.
- Redeploy after setting environment variables.
- Existing domain routing is already reaching Vercel. No Squarespace DNS change is required unless Vercel reports a separate domain configuration error.

The existing production deployment was serving the commit that deleted the app. Deploying this app with the correct root/framework restores a real application.

## Behavior and privacy

- New and returning users request an email code and enter it inside the app; the first successful sign-in creates an account. This keeps installed iPhone users in their app instead of opening a separate Safari session.
- Sessions persist in browser cookies and refresh through `proxy.ts`.
- Every read and mutation checks the authenticated user. PostgreSQL RLS independently restricts rows by `auth.uid()`.
- All data lives in Supabase. There is no local-only account or weight database.
- Weights are stored in kilograms to three decimal places; lb and kg are display/input units. Entries support optional notes, editing, and confirmed deletion.
- Multiple entries per day are supported; same-day entries use newest creation time first.
- History uses pages of 30, newest first. Summary cards on later pages are explicitly labeled for that page.
- The service worker stores only a generic offline page and public icons. It never caches private logs, auth callbacks, or mutation responses.
- Viewing and saving entries requires an internet connection. Unsubmitted drafts remain in the current page only and are lost on reload/close.
- iPhone: Safari → Share → Add to Home Screen → enable Open as Web App if offered → Add.
- The app does not collect analytics or load external fonts.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

Tests execute the actual migration against embedded PostgreSQL (PGlite), with authenticated/anonymous roles and a stub for Supabase's auth.uid(). They cover owner CRUD, cross-user read/update/delete rejection, forged ownership, conflict/upsert attacks, anonymous denial, data constraints, date sorting, validation, unit conversion, and service-worker privacy.

Before release, additionally verify real email delivery and a two-account save/reload/sign-out flow against the deployed Supabase instance. Install and launch the app on a physical iPhone; desktop responsive checks cannot verify that OS interaction.

Production dependencies have no reported advisories at the time of implementation. The ESLint development dependency chain currently includes a braces advisory without a patched upstream version; it does not run in the deployed app.
