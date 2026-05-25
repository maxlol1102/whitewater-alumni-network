# Handoff Summary

Current state of the project as of May 2026. Update this when major infrastructure changes.

## Supabase Project
| | |
|---|---|
| Project ID | `lahnnjgugabyqtnkhtgd` |
| URL | `https://lahnnjgugabyqtnkhtgd.supabase.co` |
| Dashboard | https://supabase.com/dashboard/project/lahnnjgugabyqtnkhtgd |

### Required `.env` variables
```env
SUPABASE_URL=https://lahnnjgugabyqtnkhtgd.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_pGuIrPp0zltwJ9v8-JjNQQ_slfgETJ5
SUPABASE_SERVICE_ROLE_KEY=<secret — get from Supabase dashboard, never commit>

VITE_SUPABASE_URL=https://lahnnjgugabyqtnkhtgd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_pGuIrPp0zltwJ9v8-JjNQQ_slfgETJ5
VITE_SUPABASE_PROJECT_ID=lahnnjgugabyqtnkhtgd
```

### Regenerate TypeScript types
```bash
npx supabase gen types typescript --project-id lahnnjgugabyqtnkhtgd \
  > src/integrations/supabase/types.ts
```

## How To Run Locally
```bash
bun install
# create .env with the vars above
bun run dev
```

Build check:
```bash
bun run build
npx tsc --noEmit
```

## Current Feature Set
| Feature | Route | Admin only? |
|---------|-------|-------------|
| Dashboard | `/dashboard` | No |
| Alumni list + detail + CRUD | `/alumni` | Edit: admin only |
| Mentorship directory + chart | `/mentorship` | No |
| Email campaigns | `/campaigns` | Yes |
| Surveys + responses | `/surveys` | Yes |
| User management | `/settings/users` | Yes |
| Audit log | `/settings/audit-log` | Yes |
| ⌘K command palette | global | No |

## Auth
- Supabase email/password auth
- On signup, `handle_new_user` trigger creates a row in `profiles`
- Role (`account_role`: `admin` | `user`) and status (`invited` | `active` | `disabled` | `deleted`) live in `profiles`
- Admin account seeded in migration `20260523163711`

## Database Tables
`profiles`, `alumni`, `campaigns`, `surveys`, `survey_responses`, `audit_logs`

All 6 migrations have been applied. See `supabase/migrations/` for details.

## Known Gaps / Future TODOs
- **Replace `@lovable.dev/vite-tanstack-config`** with standard TanStack Start vite config
  (`@tanstack/start-vite-plugin` directly). The package works today but is a Lovable-managed
  devDependency that could go stale. Not urgent — no production impact.
- Seed / test-data tooling not yet set up.
- No CI pipeline configured (GitHub Actions).
- Email sending in campaigns is stubbed — not yet wired to a real provider.

## Key Files
| Purpose | Path |
|---------|------|
| Vite config | `vite.config.ts` |
| Browser Supabase client | `src/integrations/supabase/client.ts` |
| Server Supabase admin client | `src/integrations/supabase/client.server.ts` |
| Auth middleware | `src/integrations/supabase/auth-middleware.ts` |
| DB types (generated) | `src/integrations/supabase/types.ts` |
| Auth context | `src/lib/auth.tsx` |
| App shell / route guard | `src/components/layout/AppShell.tsx` |
| UI/layout rules | `CLAUDE.md` |
| AI agent rules | `AGENTS.md` |
