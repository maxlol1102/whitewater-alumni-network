# Knowledgebase — UWW CS Alumni CRM

> Single source of truth. Read this before any session. Last updated: May 2026.

---

## What This Product Is

An internal CRM for the University of Wisconsin Whitewater Computer Science department.
Admins manage alumni relationships: update records, send email campaigns, distribute surveys, coordinate mentorship, and maintain an audit trail. Faculty and student users can view alumni data and create survey campaigns.

**This is not a public product.** Every route requires a valid Supabase auth session.

---

## Supabase Project

| | |
|---|---|
| Project ID | `lahnnjgugabyqtnkhtgd` |
| URL | `https://lahnnjgugabyqtnkhtgd.supabase.co` |
| Dashboard | https://supabase.com/dashboard/project/lahnnjgugabyqtnkhtgd |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start v1 (SSR, server functions) |
| Language | TypeScript, React 19 |
| Bundler | Vite 7 |
| Router | TanStack Router (file-based) |
| Data fetching | TanStack Query |
| Database | Supabase (PostgreSQL 15) |
| Auth | Supabase Auth (email + password) |
| Styling | Tailwind CSS v4, shadcn/ui (New York), Radix UI |
| Forms | react-hook-form + zodResolver |
| Validation | Zod |
| Email | Resend API (`email.server.ts`) |
| Toasts | Sonner |
| Icons | Lucide React |
| Package manager | Bun |

---

## User Roles

Two roles exist on `profiles.account_role`. One admin account; everyone else is a user.

| Role | Who | Access summary |
|------|-----|----------------|
| `admin` | Department administrator | Full access to everything |
| `user` | Faculty or student | Read-only alumni, can create survey campaigns |

User categories (`profiles.user_category`): `faculty` or `student`. Required for all non-admin profiles.

User statuses (`profiles.status`): `invited` → `active` → `disabled` / `deleted`.
Only `active` users can log in and use the app.

**Rules:**
- `isActive(user)` — user exists and status is `active`
- `canEdit(user)` — user is active AND is admin
- `is_admin(uuid)` — Postgres security-definer function used in RLS policies

---

## Database Tables

### `profiles`
Auth users mirror. Created automatically by `handle_new_user()` trigger on signup.
```
id (uuid PK, FK → auth.users)
full_name, email, account_role, user_category, status
invited_at, accepted_at, disabled_at, deleted_at, last_sign_in_at
created_at, updated_at
```

### `alumni`
Core alumni records managed by admins.
```
id (uuid PK)
full_name, email (unique), company, job_title, graduation_year, industry
tags (text[]), mentorship_interest (bool), bio, linkedin_url, phone
archived (bool), created_at, updated_at
```

### `campaigns`
Email and survey outreach campaigns.
```
id (uuid PK)
name, subject, body (HTML)
type (email | survey)
survey_id (uuid FK → surveys, nullable)    ← links campaign to a survey
tally_form_id, tally_form_url              ← copied from survey on save
status (draft | scheduled | sending | sent | failed)
filter_mentorship_only (bool)
filter_tags (text[])
filter_grad_years (int[])
recipient_count (int)
sent_at, created_by (FK → auth.users)
created_at, updated_at
```

### `surveys`
Survey definitions (backed by Tally.so forms).
```
id (uuid PK)
title, description
form_url, tally_form_id
campaign_id (uuid FK → campaigns, nullable)   ← legacy reverse link; prefer campaigns.survey_id
response_count (int, incremented by webhook)
created_at, updated_at
```

### `survey_recipients`
Per-recipient tracking rows created when a survey campaign is sent.
```
id (uuid PK)
campaign_id (uuid FK → campaigns)
alumni_id (uuid FK → alumni, nullable)
email, name, token (unique UUID)
sent_at, opened_at, submitted_at
created_at
```

### `survey_responses`
Tally.so webhook payloads — one row per alumni submission.
```
id (uuid PK)
survey_id (uuid FK → surveys)
email, alumni_id (FK → alumni, nullable)
submitted_at
```

### `audit_logs`
Append-only admin action log. Written via service role only.
```
id (uuid PK)
actor_id (uuid), actor_email (text)
action (text — e.g. "campaign.sent")
entity_type, entity_id, entity_label
summary (text)
before (jsonb), after (jsonb)
severity (info | warning | critical)
created_at
```

### `help_content`
Admin-editable help blocks shown throughout the app.
```
key (text PK — e.g. "email_campaign")
title, body
updated_at, updated_by (FK → auth.users)
```

---

## RLS Summary

| Table | Admin | Active user | Public |
|-------|-------|-------------|--------|
| `profiles` | Full | Self only | — |
| `alumni` | Full | Read | — |
| `campaigns` | Full | Read | — |
| `surveys` | Full | Read | — |
| `survey_recipients` | Full | Read | — |
| `survey_responses` | Full | — | — |
| `audit_logs` | Read | — | — |
| `help_content` | Full (via service role) | Read | — |

All writes bypass RLS via `supabaseAdmin` (service role) inside server functions.
The service role key is only in `.env` and only imported in `src/integrations/supabase/client.server.ts`.

---

## Campaign vs Survey Architecture

These are two related but distinct concepts.

### Survey (the form definition)
- Lives at `/surveys`
- Represents a Tally.so form: has a `form_url` and optional `tally_form_id`
- Admin creates and manages surveys
- Responses arrive via Tally webhook → `survey_responses` table
- `response_count` incremented by webhook

### Campaign (the outreach event)
- Lives at `/campaigns`
- Has a `type`: `email` (admin only) or `survey` (all users)
- Email campaign: sends personalized HTML to recipients
- Survey campaign: generates a unique `token` per recipient → `/survey/respond/:token` → shows the Tally form
- Links to a survey via `campaigns.survey_id` (FK → `surveys.id`)
- When linked, `tally_form_id` and `tally_form_url` are copied from the survey at save time

### Recipient tracking flow (survey campaigns)
1. Admin/user creates survey campaign, picks a survey from the picker
2. On "Send": `survey_recipients` rows are created with unique tokens
3. Each recipient gets an email with their unique `/survey/respond/:token` link
4. Visiting that URL records `opened_at`, then redirects to Tally
5. Tally webhook records `submitted_at` on `survey_recipients` and creates a `survey_responses` row

---

## Email Sending

Provider: **Resend** (`RESEND_API_KEY` in `.env`).

If `RESEND_API_KEY` is not set, the send operation completes (status set to `sent`) but a `warning: "email_not_configured"` is returned. Survey links are still generated and tracking still works — only the email delivery is skipped.

Personalization applied per recipient at send time:
- `{{first_name}}` → first word of `full_name`
- `{{graduation_year}}` → alumni graduation year
- `{{survey_link}}` → unique `/survey/respond/:token` URL (survey campaigns only)

---

## Help Content System

Admins can update help text shown across the app without a code change.

- **DB table**: `help_content` (key, title, body)
- **Component**: `<HelpBlock helpKey="..." fallback={...} />` in `src/components/ui/HelpBlock.tsx`
- **Admin UI**: Settings → Help content → `/settings/help-content`
- **Cache**: React Query, 5-minute stale time

Existing keys:

| Key | Shown on |
|-----|---------|
| `email_campaign` | Campaigns list, CampaignForm (email type) |
| `survey_campaign` | CampaignForm (survey type) |
| `survey` | Surveys list |
| `mentorship` | Mentorship page |
| `alumni_import` | CSV import dialog |

---

## Server Function Pattern

All mutations go through `createServerFn` in `src/lib/*.functions.ts`. Never mutate directly from components.

```ts
export const myMutation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => MyZodSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertCallerIsAdmin(supabase, userId); // omit for user-accessible endpoints
    // ... mutation via supabaseAdmin (service role)
    await writeAudit({ actor_id: userId, actor_email: ..., action: "...", ... });
    return result;
  });
```

Key helpers:
- `requireSupabaseAuth` — validates Bearer token, attaches `supabase`, `userId`, `claims`
- `assertCallerIsAdmin` — throws 403 if not admin
- `writeAudit` — required after every successful admin mutation
- `supabaseAdmin` — service role client, bypasses RLS, server-only

---

## File Map

```
src/
  routes/
    __root.tsx               App root, providers
    _app.tsx                 Authenticated shell (AppShell)
    index.tsx                Redirect → /dashboard or /login
    login.tsx                Login page
    _app.dashboard.tsx
    _app.alumni.index.tsx    Alumni list
    _app.alumni.new.tsx
    _app.alumni.$id.tsx
    _app.alumni.$id_.edit.tsx
    _app.mentorship.tsx
    _app.campaigns.index.tsx
    _app.campaigns.new.tsx
    _app.campaigns.$id.tsx
    _app.campaigns.$id_.edit.tsx
    _app.surveys.index.tsx
    _app.surveys.new.tsx
    _app.surveys.$id.tsx
    _app.surveys.$id_.edit.tsx
    _app.settings.users.tsx
    _app.settings.users_.new.tsx
    _app.settings.audit-log.tsx
    _app.settings.help-content.tsx
    survey.respond.$token.tsx   Public — no auth required

  lib/
    auth.tsx                 AuthProvider, useAuth, isActive, canEdit
    alumni.functions.ts      Alumni CRUD server fns
    alumni.server.ts         writeAudit, assertCallerIsAlumniEditable
    campaigns.functions.ts   Campaign CRUD + send
    surveys.functions.ts     Survey CRUD + responses
    help-content.functions.ts Help content CRUD
    users.functions.ts       User management
    users.server.ts          assertCallerIsAdmin
    audit.functions.ts       listAuditLogs
    dashboard.functions.ts   Dashboard stats
    email-templates.ts       Static email HTML templates
    email.server.ts          sendPersonalizedBatch (Resend)
    theme.tsx                Light/dark theme context
    utils.ts                 cn(), other helpers

  components/
    layout/
      AppShell.tsx           Auth gate, sidebar + main layout
      Sidebar.tsx            Nav sidebar with sections
      Page.tsx               PageContainer, PageHeader, PageSection, Breadcrumbs, EmptyState
      CommandPalette.tsx     ⌘K global search
    ui/
      HelpBlock.tsx          Dynamic help content component
      (shadcn primitives)
    alumni/
      AlumniForm.tsx
      ImportDialog.tsx
    campaigns/
      CampaignForm.tsx       Create/edit campaign form with survey picker
      TemplatePicker.tsx     Email template grid/list picker
    surveys/
      SurveyForm.tsx
    users/
      EditUserDialog.tsx

  integrations/supabase/
    client.ts                Browser Supabase client (publishable key)
    client.server.ts         supabaseAdmin (service role, server-only)
    auth-middleware.ts       requireSupabaseAuth
    types.ts                 Generated DB types (never edit manually)

supabase/
  migrations/               All schema migrations in order
  config.toml               Supabase project config
```

---

## Running Locally

```bash
bun install
# create .env (see HANDOFF_SUMMARY.md for variables)
bun run dev
```

Type check: `npx tsc --noEmit`
Build check: `bun run build`
Push new migration: `npx supabase db push`
Regenerate types: `npx supabase gen types typescript --project-id lahnnjgugabyqtnkhtgd > src/integrations/supabase/types.ts`
