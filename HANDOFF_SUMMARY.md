# Handoff Summary

Current state as of May 2026. Update this when major infrastructure changes.

---

## Quick Links

| Document | Purpose |
|----------|---------|
| `KNOWLEDGEBASE.md` | Source of truth — start here |
| `AGENTS.md` | AI agent rules and technical reference |
| `CLAUDE.md` | UI patterns and engineering rules |
| `IMPLEMENTATION_STATUS.md` | What's done, in progress, planned |
| `CHANGELOG.md` | Feature history |
| `DECISIONS.md` | Architecture decisions with rationale |
| `FUTURE_IMPROVEMENTS.md` | Backlog ideas |
| `docs/ARCHITECTURE.md` | Technical deep dive, DB schema, flows |
| `docs/PERMISSIONS.md` | Complete access control matrix |
| `docs/email-templates.md` | Email template system reference |
| `MIGRATION_TO_OWN_SUPABASE.md` | Historical: migration from Lovable cloud |

---

## Supabase Project

| | |
|---|---|
| Project ID | `lahnnjgugabyqtnkhtgd` |
| URL | `https://lahnnjgugabyqtnkhtgd.supabase.co` |
| Dashboard | https://supabase.com/dashboard/project/lahnnjgugabyqtnkhtgd |

### Required `.env`
```env
SUPABASE_URL=https://lahnnjgugabyqtnkhtgd.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_pGuIrPp0zltwJ9v8-JjNQQ_slfgETJ5
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard — never commit>

VITE_SUPABASE_URL=https://lahnnjgugabyqtnkhtgd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_pGuIrPp0zltwJ9v8-JjNQQ_slfgETJ5
VITE_SUPABASE_PROJECT_ID=lahnnjgugabyqtnkhtgd

RESEND_API_KEY=<Resend API key — for email sending>
```

---

## How to Run Locally

```bash
bun install
# create .env with the variables above
bun run dev
```

Build check: `bun run build`
Type check: `npx tsc --noEmit`

---

## Migrations

10 migrations applied to `lahnnjgugabyqtnkhtgd`. All tracked in `supabase/migrations/`.

```
20260523162217   Core schema: profiles, alumni, campaigns, surveys, audit_logs, RLS
20260523162240   Security hardening: revoke execute on security-definer functions
20260523163711   pgcrypto, handle_new_user trigger, seed admin user
20260523164042   Grant is_admin() execute to authenticated role
20260523180900   alumni.email unique constraint
20260524010332   FK constraints, indexes for survey_responses and audit_logs
20260525120000   Add tally_form_id to surveys
20260525140000   Survey campaigns: type/tally columns on campaigns, survey_recipients table
20260525160000   help_content table + seed 5 default keys
20260525170000   survey_id FK on campaigns, SELECT RLS for surveys+campaigns to all users
```

### Pushing a new migration

```bash
supabase migration new <description>
# edit supabase/migrations/<timestamp>_<description>.sql
supabase db push
```

If the migration history is out of sync (error: "relation already exists"):
```bash
npx supabase migration repair --status applied <timestamp>
npx supabase db push
```

### Regenerate TypeScript types
```bash
npx supabase gen types typescript --project-id lahnnjgugabyqtnkhtgd \
  > src/integrations/supabase/types.ts
```

Run this after every schema change. Currently outdated — columns from migrations `20260525120000` and `20260525170000` are missing from the generated types.

---

## Current Feature Set

| Feature | Route | Who can access |
|---------|-------|---------------|
| Dashboard | `/dashboard` | All active users |
| Alumni list + detail | `/alumni` | All active users |
| Alumni CRUD + import | `/alumni/new`, `edit` | Admin only |
| Mentorship directory | `/mentorship` | All active users |
| Campaigns list + detail | `/campaigns` | All active users |
| Email campaign create | `/campaigns/new` | Admin only |
| Survey campaign create | `/campaigns/new` | All active users |
| Campaign edit/delete/send | `/campaigns/:id` | Admin only |
| Surveys list + detail | `/surveys` | All active users |
| Survey CRUD | `/surveys/new`, `edit` | Admin only |
| User management | `/settings/users` | Admin only |
| Audit log | `/settings/audit-log` | Admin only |
| Help content management | `/settings/help-content` | Admin only |
| Survey respond (public) | `/survey/respond/:token` | No auth required |

---

## Known Technical Debt

1. **Supabase types outdated** — `tally_form_id` on surveys and `survey_id` on campaigns are missing from `types.ts`. Workaround: `(supabaseAdmin as any).from(...)`. Fix: regenerate types.
2. **No CI pipeline** — builds and type-checks are manual.
3. **No test suite** — manual testing only.
4. **`@lovable.dev/vite-tanstack-config`** — Lovable-managed devDependency; replace with `@tanstack/start-vite-plugin` when convenient.

---

## Auth

- Supabase email/password auth
- On signup, `handle_new_user` trigger creates a row in `profiles`
- `account_role` (`admin` | `user`) and `status` (`invited` | `active` | `disabled` | `deleted`) live in `profiles`
- Admin account seeded in migration `20260523163711`
- Only `active` users can access the app (enforced in `AppShell.tsx`)
