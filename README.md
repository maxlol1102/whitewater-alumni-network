# UWW CS Alumni CRM

Internal alumni management platform for the University of Wisconsin-Whitewater Computer Science Department. Not a public alumni portal — a private admin tool for department staff.

## Business Goals

The CS department has no structured way to stay connected with graduates. This platform solves that by giving the department:

- **A single alumni record system** — track where graduates work, their skills, and their willingness to mentor, instead of scattered spreadsheets
- **Targeted outreach** — send personalized email campaigns to filtered segments of alumni (by graduation year, industry, tags, or mentorship interest)
- **Survey distribution and tracking** — collect structured feedback from alumni and match responses back to individual records
- **Mentorship coordination** — maintain a directory of alumni open to mentoring students, filterable by category, so faculty can connect the right people
- **Role-based access** — admins manage data and run campaigns; faculty can read alumni and mentorship info; a super admin manages users and sees the full audit trail
- **Accountability** — every important action is logged in an append-only audit log so the department knows who changed what and when

This is a desktop-first internal tool. No public pages, no alumni self-service, no student portal.

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
