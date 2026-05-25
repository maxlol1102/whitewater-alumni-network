# Migration: Lovable Cloud → Own Supabase Project

Documents what was done to move from Lovable-managed Supabase to a self-owned project.
Status: **Complete** as of May 2026.

## What Changed

| Item | Before | After |
|------|--------|-------|
| Supabase project | Lovable-managed (project `dflyfzcctmzxfkdzpynb`) | Self-owned (`lahnnjgugabyqtnkhtgd`) |
| `.env` | Pointed to old project | Points to new project |
| `supabase/config.toml` | Old project ID | `lahnnjgugabyqtnkhtgd` |
| Schema | Managed by Lovable | 6 migrations in `supabase/migrations/` |
| Secrets | In Lovable dashboard | In local `.env` only |

## Migrations Applied
All 6 migrations were applied via the Supabase Management REST API
(used because `supabase db push` had SASL auth issues with CLI v2):

| Migration | Contents |
|-----------|----------|
| `20260523162217` | Core schema: `profiles`, `alumni`, `campaigns`, `surveys`, `survey_responses`, `audit_logs`; functions `is_admin`, `handle_new_user`, `set_updated_at`; RLS policies |
| `20260523162240` | Security hardening: revoke public execute on DB functions |
| `20260523163711` | pgcrypto extension; `on_auth_user_created` trigger; seed admin user |
| `20260523164042` | Grant `is_admin(uuid)` execute to `authenticated` role |
| `20260523180900` | Unique index on `alumni.email` (case-insensitive) |
| `20260524010332` | FK constraints for `survey_responses`; indexes on audit_logs, surveys, responses |

## Security Notes
- The old Lovable project credentials appear in early git history — they are harmless
  (that project is abandoned and no longer in use).
- The current `SUPABASE_SERVICE_ROLE_KEY` is in `.env` only (gitignored). It is never
  committed and never imported in browser/component code.
- RLS is active on all tables. Service role is used only in server functions.

## How To Verify The Migration Is Complete
```bash
# 1. Check .env points to the right project
grep lahnnjgugabyqtnkhtgd .env

# 2. Confirm no old project ID anywhere in source
grep -r dflyfzcctmzxfkdzpynb src/ supabase/ --include="*.ts" --include="*.toml"
# Expected: no output

# 3. Type check
npx tsc --noEmit

# 4. Build
bun run build
```

## How To Regenerate TypeScript Types
```bash
# Requires supabase CLI logged in: supabase login
npx supabase gen types typescript --project-id lahnnjgugabyqtnkhtgd \
  > src/integrations/supabase/types.ts
```
Run this whenever the Supabase schema changes (new table, column, or function).

## How To Push Future Schema Changes
```bash
# Create a new migration file
supabase migration new <description>
# Edit the file in supabase/migrations/
# Apply to the linked project
supabase db push
```
