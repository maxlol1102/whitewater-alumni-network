# Architecture

Technical deep-dive for the UWW CS Alumni CRM.
For day-to-day conventions, see `CLAUDE.md` and `AGENTS.md`.

---

## Request Lifecycle

```
Browser
  → TanStack Router → _app.tsx (AppShell auth gate)
  → Route component
  → useServerFn() call
  → createServerFn handler (server)
      → requireSupabaseAuth (validates JWT, attaches userId)
      → assertCallerIsAdmin (if admin-only)
      → supabaseAdmin.from(...) [service role, bypasses RLS]
      → writeAudit()
  → TanStack Query cache → component re-render
```

---

## Database Schema

### Tables

**profiles** — mirrors `auth.users`, created by `handle_new_user()` trigger
```
id uuid PK (→ auth.users), full_name, email unique,
account_role (admin|user), user_category (faculty|student),
status (invited|active|disabled|deleted),
invited_at, accepted_at, disabled_at, deleted_at, last_sign_in_at,
created_at, updated_at
```

**alumni** — core alumni records
```
id uuid PK, full_name, email unique, company, job_title,
graduation_year int, industry, tags text[], mentorship_interest bool,
bio, linkedin_url, phone, archived bool, created_at, updated_at
```

**campaigns** — email and survey outreach
```
id uuid PK, name, subject, body (HTML),
type (email|survey),
survey_id uuid → surveys (nullable, ON DELETE SET NULL),
tally_form_id, tally_form_url,         ← copied from survey on save
status (draft|scheduled|sending|sent|failed),
filter_mentorship_only bool, filter_tags text[], filter_grad_years int[],
recipient_count int, sent_at, created_by → auth.users,
created_at, updated_at
```

**surveys** — Tally.so form definitions
```
id uuid PK, title, description, form_url, tally_form_id,
campaign_id uuid → campaigns (nullable, legacy reverse link),
response_count int, created_at, updated_at
```

**survey_recipients** — per-recipient rows created when a survey campaign is sent
```
id uuid PK, campaign_id → campaigns, alumni_id → alumni (nullable),
email, name, token text unique,
sent_at, opened_at, submitted_at, created_at
```

**survey_responses** — Tally webhook payloads
```
id uuid PK, survey_id → surveys, email, alumni_id → alumni (nullable), submitted_at
```

**audit_logs** — append-only admin action log (never updated or deleted)
```
id uuid PK, actor_id uuid, actor_email,
action text (e.g. "campaign.sent"), entity_type, entity_id, entity_label,
summary, before jsonb, after jsonb, severity (info|warning|critical), created_at
```

**help_content** — admin-editable feature help text
```
key text PK (e.g. "email_campaign"), title, body,
updated_at, updated_by → auth.users
```

### Postgres Functions

```sql
is_admin(_user_id uuid) RETURNS boolean   -- security definer; used in RLS policies
handle_new_user() RETURNS trigger         -- creates profiles row on signup
set_updated_at() RETURNS trigger          -- sets updated_at = now() before update
```

`is_admin()` is revoked from `public`, `anon`, `authenticated` — only RLS policy evaluation can call it.

---

## Campaigns ↔ Surveys Relationship

Two FK directions exist — know the difference:

| Column | Direction | Purpose |
|--------|-----------|---------|
| `campaigns.survey_id` | campaign → survey | **Primary.** Campaign references which survey it distributes. Set via survey picker. |
| `surveys.campaign_id` | survey → campaign | **Legacy.** May be NULL. Not used for campaign logic. |

When a campaign is saved with a `survey_id`, the server looks up the survey and copies its `tally_form_id` and `form_url` onto the campaign. This makes the campaign self-contained for sending — no survey join needed at send time.

---

## Permission Map (server functions)

| Operation | Admin | Active user |
|-----------|-------|-------------|
| Alumni list/detail | ✓ | ✓ |
| Alumni CRUD | ✓ | — |
| Campaigns list/detail | ✓ | ✓ |
| Preview recipients | ✓ | ✓ |
| Create email campaign | ✓ | — |
| Create survey campaign | ✓ | ✓ |
| Edit/delete/send campaign | ✓ | — |
| Surveys list/detail | ✓ | ✓ |
| Survey CRUD | ✓ | — |
| Survey recipients list | ✓ | ✓ |
| Help content read | ✓ | ✓ |
| Help content write | ✓ | — |
| Users, audit log | ✓ | — |

Mixed-type enforcement example:
```ts
if (data.type === "email") await assertCallerIsAdmin(supabase, userId);
// survey type: any active user continues
```

---

## RLS Summary

| Table | Non-admin read | Admin | Notes |
|-------|---------------|-------|-------|
| `profiles` | Own row only | Full | `is_admin()` in policy |
| `alumni` | All rows | Full | |
| `campaigns` | All rows | Full | |
| `surveys` | All rows | Full | |
| `survey_recipients` | — | Full | No user SELECT policy; access via service role |
| `survey_responses` | — | Full | |
| `audit_logs` | — | Read | Written via service role only |
| `help_content` | All rows | Full via service role | No write policy for authenticated role |

---

## Email Sending

Provider: Resend. Configured via `RESEND_API_KEY` in `.env`.

If `RESEND_API_KEY` is missing: send is skipped, campaign status still set to `sent`, warning returned to UI. Survey links are still generated and tracking works.

**Personalization** (`personalizeBody()` in `campaigns.functions.ts`):
- `{{first_name}}` → first word of alumni `full_name`
- `{{graduation_year}}` → alumni `graduation_year`
- `{{survey_link}}` → unique `/survey/respond/:token` URL (survey campaigns only)

Applied per recipient at send time. Never stored in DB.

---

## Survey Token Tracking Flow

```
1. Admin/user clicks Send on a survey campaign
   → server creates one survey_recipients row per alumni (unique token per row)
   → sends personalized emails with /survey/respond/:token links

2. Alumni visits /survey/respond/:token
   → trackSurveyOpen server fn (public, no auth)
   → records survey_recipients.opened_at
   → returns tally_form_url
   → page redirects to the Tally form

3. Alumni submits Tally form
   → Tally webhook → Supabase Edge Function
   → inserts survey_responses row
   → updates survey_recipients.submitted_at (matched by email + campaign_id)
   → increments surveys.response_count
```

---

## Key Architecture Decisions

**Survey picker replaces manual Tally inputs** — Users pick from existing surveys rather than typing Tally IDs. Creates an explicit FK relationship; server auto-fills tally fields. Old approach was error-prone and disconnected from the surveys table.

**Survey campaigns open to all active users; email campaigns admin-only** — Faculty/students need to distribute surveys. Email campaigns carry more brand/mass-outreach risk and warrant admin oversight. The split is enforced at the server function level, not just in the UI.

**Dynamic help content in DB** — Admins can update explanatory text for any feature without a code deploy. `<HelpBlock>` component fetches by key and caches for 5 minutes. Every new feature page should use it.

**Email preview in sandboxed iframe** — The campaign form previews HTML in `<iframe srcDoc={...} sandbox="allow-same-origin">`. Prevents template `<script>` tags from executing and isolates email CSS from the app's Tailwind styles.

**All mutations through server functions** — `supabaseAdmin` is only used inside `createServerFn` handlers. Components never import it. This ensures Zod validation, admin checks, and audit logging are never skipped.

**Flat file-based routing with `_` suffix** — The `_` on a segment (e.g. `$id_`) breaks TanStack Router's automatic layout nesting. Every page is a direct child of `_app` — no nested `<Outlet>` chains.

**RLS on every table; service role server-side only** — Defense in depth. Even if a server function has a bug, Postgres RLS is a second guard. The service role key never leaves the server.

**One admin account; `user_category` required for all others** — Enforced by a DB check constraint: `account_role = 'admin' OR user_category IS NOT NULL`. Role escalation is not self-service.

---

## Migrations Applied

```
20260523162217   Core schema: profiles, alumni, campaigns, surveys, audit_logs, RLS
20260523162240   Security hardening: revoke execute on security-definer functions
20260523163711   pgcrypto, handle_new_user trigger, seed admin user
20260523164042   Grant is_admin() execute to authenticated role
20260523180900   alumni.email unique constraint
20260524010332   FK constraints, indexes for survey_responses and audit_logs
20260525120000   Add tally_form_id to surveys
20260525140000   Survey campaigns: type/tally columns, survey_recipients table
20260525160000   help_content table + seed 5 default keys
20260525170000   survey_id FK on campaigns, SELECT RLS for surveys+campaigns to all users
```

Supabase generated types (`types.ts`) are outdated — they predate migrations `20260525120000` and `20260525170000`. Workaround: `(supabaseAdmin as any).from(...)`. Fix: regenerate types.
