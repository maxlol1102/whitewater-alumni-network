# UWW CS Alumni CRM

Internal CRM for the University of Wisconsin Whitewater Computer Science department. Admins manage alumni records, send email campaigns, distribute surveys, and coordinate mentorship. Faculty and student users can view alumni data and create survey campaigns.

## Stack

- **Framework:** TanStack Start v1 (SSR + server functions), React 19, TypeScript, Vite 7
- **Router:** TanStack Router (file-based)
- **Database:** Supabase (PostgreSQL 15), project `lahnnjgugabyqtnkhtgd`
- **Auth:** Supabase Auth (email/password)
- **Styling:** Tailwind CSS v4, shadcn/ui (New York), Radix UI
- **Email:** Resend API
- **Package manager:** Bun

## Running Locally

```bash
bun install
# create .env (see below)
bun run dev
```

Build: `bun run build` | Type check: `npx tsc --noEmit`

### `.env`

```env
SUPABASE_URL=https://lahnnjgugabyqtnkhtgd.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_pGuIrPp0zltwJ9v8-JjNQQ_slfgETJ5
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard — never commit>

VITE_SUPABASE_URL=https://lahnnjgugabyqtnkhtgd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_pGuIrPp0zltwJ9v8-JjNQQ_slfgETJ5
VITE_SUPABASE_PROJECT_ID=lahnnjgugabyqtnkhtgd

RESEND_API_KEY=<Resend key — optional; app works without it, emails just aren't sent>
```

## Supabase

| | |
|---|---|
| Project ID | `lahnnjgugabyqtnkhtgd` |
| Dashboard | https://supabase.com/dashboard/project/lahnnjgugabyqtnkhtgd |

Push a migration: `npx supabase db push`

Regenerate TypeScript types after schema changes:
```bash
npx supabase gen types typescript --project-id lahnnjgugabyqtnkhtgd \
  > src/integrations/supabase/types.ts
```

## Features

| Feature | Who |
|---------|-----|
| Dashboard | All active users |
| Alumni list, detail, CRUD, CSV import | List: all users. CRUD: admin only |
| Mentorship directory | All active users |
| Campaigns list + detail | All active users |
| Email campaign create | Admin only |
| Survey campaign create | All active users |
| Campaign edit / delete / send | Admin only |
| Surveys list + detail | All active users |
| Survey CRUD | Admin only |
| User management | Admin only |
| Audit log | Admin only |
| Help content management | Admin only |
| Public survey response page | No auth required |

## Docs

| File | Purpose |
|------|---------|
| `CLAUDE.md` | UI patterns and engineering rules for building features |
| `AGENTS.md` | Technical reference: DB schema, server fn pattern, key files |
| `docs/ARCHITECTURE.md` | Deep dive: data flow, RLS, email/survey tracking, key decisions |
| `docs/email-templates.md` | Email template system and placeholder reference |
| `CHANGELOG.md` | Feature history |

## Known Tech Debt

- Supabase TypeScript types are outdated (columns from recent migrations are missing). Workaround: `(supabaseAdmin as any).from(...)`. Fix: regenerate types.
- No CI pipeline (no GitHub Actions).
- No test suite.
- `@lovable.dev/vite-tanstack-config` is a Lovable-managed devDep; replace with `@tanstack/start-vite-plugin` when convenient.

## Backlog

1. Regenerate Supabase TypeScript types
2. GitHub Actions CI (build + typecheck on PR)
3. Alumni bulk CSV export
4. Email open/click tracking via Resend webhooks
5. Campaign scheduling (send at a future time)
