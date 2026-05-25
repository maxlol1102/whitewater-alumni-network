# Implementation Status

Last updated: May 2026.

---

## Done

### Core Infrastructure
- [x] TanStack Start v1 + TanStack Router file-based routing
- [x] Supabase Auth (email/password, magic links disabled)
- [x] `profiles` auto-created on signup via `handle_new_user` trigger
- [x] Two-role system: `admin` / `user` stored in `profiles.account_role`
- [x] RLS on all tables; service role only in server functions
- [x] `is_admin()` Postgres security-definer function
- [x] `writeAudit()` helper — every admin mutation logged
- [x] Dark/light theme toggle
- [x] Sidebar with section grouping, active state, number badges
- [x] ⌘K command palette (global search)
- [x] Sonner toasts for all actions
- [x] Skeleton loading states on all list/detail pages
- [x] Empty states on all list pages

### Alumni
- [x] List with search, tag filter, pagination
- [x] Detail page (full profile view)
- [x] Create / edit form
- [x] Archive (soft delete)
- [x] CSV import (bulk create/update by email)
- [x] Bulk tag editor
- [x] Tags stored as `text[]`, filterable in campaigns

### Mentorship
- [x] Directory of alumni with `mentorship_interest = true`
- [x] Session booking (admin creates mentorship sessions linked to alumni)
- [x] Chart: mentorship opt-ins by graduation year

### Email Campaigns
- [x] Create campaign with name, subject, HTML body
- [x] 4 static email templates: Mentorship Invite, Newsletter, Event Invite, Survey Request
- [x] Template picker (grid view / list view toggle)
- [x] Blank template with UWW branding skeleton
- [x] Edit/Preview tab on email body (sandboxed iframe, placeholder substitution)
- [x] Audience filters: tags, graduation year, mentorship-only
- [x] Live recipient count preview
- [x] Personalization at send time: `{{first_name}}`, `{{graduation_year}}`
- [x] Resend API integration (`sendPersonalizedBatch`)
- [x] Send/delete/edit actions on draft campaigns
- [x] Campaign detail page with status, recipient count, sent date

### Survey Campaigns
- [x] Survey type toggle in campaign form (admin only)
- [x] Survey picker: select from existing surveys (replaces manual Tally ID/URL inputs)
- [x] `survey_id` FK on campaigns → surveys
- [x] Tally form ID/URL auto-copied from selected survey at save time
- [x] Unique token per recipient (`survey_recipients` table)
- [x] Public `/survey/respond/:token` page tracks opens, redirects to Tally
- [x] `opened_at`, `submitted_at` tracking per recipient
- [x] Campaign detail shows recipient table with open/submit status
- [x] Non-admins can create survey campaigns (admin permission not required)

### Surveys
- [x] Survey list and detail pages
- [x] Create / edit survey form (title, description, Tally form URL/ID)
- [x] Tally webhook → `survey_responses` table (via Supabase Edge Function)
- [x] Response count on survey list
- [x] Linked campaign shown on survey detail
- [x] Read access open to all active users (admin manages CRUD)

### User Management (admin only)
- [x] User list with search, status filter, category filter, show-deleted toggle
- [x] Invite new user (creates auth account + profile row)
- [x] Edit user (name, role, category)
- [x] Disable / reactivate / delete users
- [x] Resend invitation / cancel invitation
- [x] Admin account protected from modification

### Audit Log (admin only)
- [x] Paginated log of all admin actions
- [x] Filter by action type, entity type, actor, date range
- [x] Before/after JSON diff viewer

### Dynamic Help Content
- [x] `help_content` DB table (key, title, body)
- [x] `<HelpBlock>` component — fetches by key, shows fallback while loading
- [x] Admin pencil icon on HelpBlock → `/settings/help-content?key=...`
- [x] Settings → Help content admin page (CRUD for all keys)
- [x] 5 seeded keys: `email_campaign`, `survey_campaign`, `survey`, `mentorship`, `alumni_import`
- [x] Used on: Campaigns list, CampaignForm, Surveys list

### Dashboard
- [x] Alumni count, mentorship opt-in rate, recent activity
- [x] Campaign and survey stats cards

---

## In Progress

Nothing active at the moment.

---

## Known Gaps

| Gap | Impact | Notes |
|-----|--------|-------|
| Supabase types not regenerated after latest migrations | TypeScript sees no `tally_form_id` on `surveys`, `survey_id` on `campaigns` | Use `(supabaseAdmin as any)` workaround; run `supabase gen types` to fix properly |
| No CI pipeline | Manual build/type-check only | GitHub Actions not configured |
| No test suite | Correctness verified manually | No unit or integration tests |
| Seed / test data tooling | Manual DB inserts for dev data | No seed script |
| `@lovable.dev/vite-tanstack-config` dependency | Works today; Lovable-managed devDep | Replace with `@tanstack/start-vite-plugin` when convenient |

---

## Planned / Backlog

See `FUTURE_IMPROVEMENTS.md` for the full backlog.

Priority items:
1. Regenerate Supabase TypeScript types to eliminate `as any` casts
2. GitHub Actions CI (build + type-check on PR)
3. Alumni bulk export (CSV download)
4. Email open/click tracking (Resend webhooks)
5. Campaign scheduling (send at a future time)
