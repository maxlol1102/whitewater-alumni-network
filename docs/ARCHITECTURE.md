# Architecture

Technical reference for the UWW CS Alumni CRM.

---

## Request Lifecycle

```
Browser → TanStack Router → _app.tsx (AppShell)
                           ↓
                     requireAuth gate
                     (Supabase session)
                           ↓
              Route component (src/routes/_app.*.tsx)
                           ↓
              useServerFn → createServerFn handler
                           ↓
              requireSupabaseAuth middleware
              (validates Bearer token, attaches userId)
                           ↓
              [assertCallerIsAdmin if needed]
                           ↓
              supabaseAdmin.from(...) — service role, bypasses RLS
                           ↓
              writeAudit (after mutations)
                           ↓
              return result → TanStack Query cache → component
```

---

## Database Schema

### Entity-Relationship Overview

```
auth.users ──── profiles (1:1)
                    │
                    └── created campaigns, audit entries

alumni ──── mentorship_sessions (1:many)
  │
  └── alumni_id on survey_responses, survey_recipients

campaigns ──── survey_id ──► surveys (many:1, nullable)
    │
    └── campaign_id ◄── surveys.campaign_id (legacy reverse link)

campaigns ──── survey_recipients (1:many)
                    │
                    └── token → /survey/respond/:token

surveys ──── survey_responses (1:many, via Tally webhook)

audit_logs (append-only, admin read)
help_content (keyed by feature slug)
```

### Campaigns ↔ Surveys Relationship

There are **two FK directions** between campaigns and surveys. Understand both:

| Column | Direction | Purpose |
|--------|-----------|---------|
| `campaigns.survey_id` | campaign → survey | **Current.** Campaign references which survey it distributes. Set via survey picker on CampaignForm. |
| `surveys.campaign_id` | survey → campaign | **Legacy.** Created when a survey was first set up. May be NULL. Not the primary relationship. |

The server auto-copies `tally_form_id` and `form_url` from `surveys` onto `campaigns.tally_form_id` / `campaigns.tally_form_url` at save time. This duplication means the campaign is self-contained: it doesn't need to join surveys to send emails or generate links.

---

## Authentication

Supabase Auth (email/password). Sessions stored as JWTs in localStorage (Supabase default).

**Browser side:**
- `supabase` client from `client.ts` handles session state
- `AuthProvider` in `auth.tsx` wraps the app and exposes `user` via `useAuth()`
- `AppShell` redirects unauthenticated users to `/login`

**Server side:**
- Every server function uses `requireSupabaseAuth` middleware
- Middleware extracts the Bearer token from the request header
- Creates a user-scoped Supabase client and calls `auth.getUser()` to validate
- Attaches `supabase`, `userId`, `claims` to the handler context

**Admin check:**
```ts
await assertCallerIsAdmin(context.supabase, context.userId);
// Throws: "Forbidden" if user is not admin
// Uses: context.supabase (user-scoped) — so RLS-respecting is_admin() check
```

---

## Server Functions

All mutations and admin reads use `createServerFn` from TanStack Start.

### File organization
```
src/lib/
  *.functions.ts    — exported server functions (imported in components via useServerFn)
  *.server.ts       — shared server-only helpers (not exported to components)
```

### Pattern
```ts
export const myFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])          // always
  .inputValidator((i) => Schema.parse(i))    // always, Zod
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;

    // For admin-only:
    await assertCallerIsAdmin(supabase, userId);

    // DB access via service role (bypasses RLS):
    const { data: result, error } = await supabaseAdmin.from("table").select("*");
    if (error) throw new Error(error.message);

    // After every successful admin mutation:
    await writeAudit({ actor_id: userId, actor_email: claims.email, action: "...", ... });

    return result;
  });
```

### Permission matrix per function

| Function | Min permission |
|----------|---------------|
| `listAlumni`, `getAlumni` | active user |
| `createAlumni`, `updateAlumni`, `deleteAlumni` | admin |
| `listCampaigns`, `getCampaign` | active user |
| `previewRecipients` | active user |
| `createCampaign` — email type | admin |
| `createCampaign` — survey type | active user |
| `updateCampaign`, `deleteCampaign`, `sendCampaign` | admin |
| `listSurveys`, `getSurvey` | active user |
| `createSurvey`, `updateSurvey`, `deleteSurvey` | admin |
| `listSurveyRecipients` | active user |
| `trackSurveyOpen` | public (no auth) |
| `listUsers`, `updateUser`, `disableUser`, etc. | admin |
| `listAuditLogs` | admin |
| `getHelpContent` | active user |
| `listHelpContent`, `upsertHelpContent`, `deleteHelpContent` | admin |

---

## Email Sending

Provider: **Resend**. Key: `RESEND_API_KEY` in `.env`.

```
sendPersonalizedBatch(batch: {to, subject, html}[])
  → Resend batch API
  → returns { sent: boolean, reason?: string }
```

If `RESEND_API_KEY` is missing: returns `{ sent: false, reason: "not_configured" }`.
The campaign status is still set to `sent` and the UI shows a warning toast.

**Personalization** (`personalizeBody()` in `campaigns.functions.ts`):
```ts
html.replaceAll("{{first_name}}", firstName)
    .replaceAll("{{graduation_year}}", String(year))
    .replaceAll("{{survey_link}}", uniqueTokenUrl)  // survey campaigns only
```

Applied per recipient at send time. Never stored in the DB.

---

## Survey Response Tracking

### Token flow

```
1. sendCampaign (survey type)
   → creates survey_recipients rows (one per alumni, unique token)
   → sends emails with /survey/respond/:token links

2. Alumni visits /survey/respond/:token
   → trackSurveyOpen server fn (public, no auth)
   → records opened_at on survey_recipients
   → returns tally_form_url
   → page redirects to Tally form

3. Alumni submits Tally form
   → Tally webhook → Supabase Edge Function
   → inserts into survey_responses
   → updates submitted_at on matching survey_recipients (matched by email + campaign_id)
   → increments surveys.response_count
```

### What gets tracked

| Event | Where stored |
|-------|-------------|
| Email sent | `survey_recipients.sent_at` |
| Link opened | `survey_recipients.opened_at` |
| Form submitted | `survey_recipients.submitted_at` + `survey_responses` row |

---

## RLS Policies

### `profiles`
- `profiles_self_select` — authenticated users can read their own row
- `profiles_self_update` — can update own row, cannot change `account_role`
- `profiles_admin_all` — admins have full access

### `alumni`
- `alumni_select_authenticated` — all authenticated users can read
- `alumni_admin_all` — admins have full CRUD

### `campaigns`
- `campaigns_admin_all` — admins have full CRUD
- `authenticated users can read campaigns` — all authenticated users can SELECT

### `surveys`
- `surveys_admin_all` — admins have full CRUD
- `authenticated users can read surveys` — all authenticated users can SELECT

### `survey_recipients`
- `survey_recipients_admin_all` — admins have full CRUD

### `survey_responses`
- (RLS enabled; policies defined per original schema — admin read)

### `audit_logs`
- `audit_logs_admin_select` — admin read only
- Written only via service role in server functions

### `help_content`
- `authenticated users can read help_content` — all authenticated users can SELECT
- Written only via service role (no write policy needed for authenticated role)

---

## Key Postgres Functions

```sql
-- Checks if a user is an active admin. Security definer — not callable by app users.
is_admin(_user_id uuid) RETURNS boolean

-- Auto-creates profiles row on signup.
handle_new_user() RETURNS trigger

-- Sets updated_at = now() before any update.
set_updated_at() RETURNS trigger
```

`is_admin()` is revoked from `public`, `anon`, and `authenticated` roles — only RLS policy evaluation (which runs as the table owner) can call it.

---

## Frontend State Management

- **Server state**: TanStack Query. All queries keyed by entity type + optional id.
  - `["alumni"]`, `["alumni", id]`
  - `["campaigns"]`, `["campaigns", id]`
  - `["surveys"]`, `["survey-recipients", campaign_id]`
  - `["help-content", key]`
- **Mutations**: `useMutation` + `queryClient.invalidateQueries` on success
- **Local UI state**: `useState` for dialogs, filters, selected rows
- **Form state**: `react-hook-form` + `zodResolver`

---

## Routing Conventions

TanStack Router, file-based. All authenticated pages are under `_app` layout.

| Pattern | File | Notes |
|---------|------|-------|
| List | `_app.{section}.index.tsx` | |
| Create | `_app.{section}.new.tsx` | |
| Detail | `_app.{section}.$id.tsx` | |
| Edit | `_app.{section}.$id_.edit.tsx` | `_` breaks nesting |
| Nested create | `_app.{parent}_.{child}.new.tsx` | e.g. `users_.new` |
| Public | `{name}.$param.tsx` | No `_app` prefix |

The `routeTree.gen.ts` is auto-generated by TanStack Router's Vite plugin. Never edit it.

---

## Supabase TypeScript Types

`src/integrations/supabase/types.ts` is generated from the live schema. Never edit manually.

Regenerate when schema changes:
```bash
npx supabase gen types typescript --project-id lahnnjgugabyqtnkhtgd \
  > src/integrations/supabase/types.ts
```

Columns added by later migrations (`tally_form_id` on surveys, `survey_id` on campaigns) are not yet in the generated types. Until regenerated, use `(supabaseAdmin as any).from(...)` for affected queries.
