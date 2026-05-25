# Changelog

All notable changes to the UWW CS Alumni CRM, in reverse chronological order.

---

## [Unreleased]

---

## May 25, 2026

### Survey Campaign Picker
- Replaced manual Tally form ID/URL text inputs with a survey picker `<Select>` populated from the live surveys list
- Added `survey_id uuid FK` on `campaigns` → `surveys`
- Tally form ID and URL are now auto-copied from the selected survey at save time (server-side)
- Non-admins (faculty/student) can now create survey campaigns — no admin permission required
- Sidebar: Campaigns and Surveys sections now visible to all active users
- Route guards updated: campaigns list/detail and surveys list/detail open to all `isActive` users
- Email campaigns remain admin-only at creation
- RLS: added `SELECT` policies on `campaigns` and `surveys` for all authenticated users

### Help Content System
- New `help_content` table with `key`, `title`, `body` fields
- `<HelpBlock>` component: fetches by key, shows fallback, 5-minute React Query cache
- Admin sees a pencil icon on each block that links to `/settings/help-content?key=...`
- Settings → Help content admin page: CRUD for all help keys
- Seeded 5 default keys: `email_campaign`, `survey_campaign`, `survey`, `mentorship`, `alumni_import`
- Integrated on Campaigns list, CampaignForm, Surveys list

### Sidebar Restructure
- Sidebar split into 5 labeled sections: Overview, Alumni, Outreach, Settings, Docs
- Help content moved to its own "Docs" section
- Section labels use monospace uppercase tracking treatment

### Page Copy
- Rewrote all PageHeader titles and descriptions to product-quality copy across every page
- No em-dashes in descriptive copy (UI convention only in table cells)

### Blank Email Template
- Added `BLANK_TEMPLATE` with full UWW email structure and `[[bracketed]]` content placeholders

---

## May 25, 2026 (earlier)

### Email Body Preview Tab
- Added Edit/Preview tab toggle on the campaign form email body field
- Preview tab renders the HTML in a sandboxed `<iframe>` (`sandbox="allow-same-origin"`)
- `applyPreviewSamples()` replaces all known placeholders with realistic sample values

### Dynamic Help Content (DB tables)
- Migration `20260525160000` creates `help_content` table with RLS

### Survey Campaigns Infrastructure
- Migration `20260525140000` adds `type`, `tally_form_id`, `tally_form_url` to campaigns
- New `survey_recipients` table for per-recipient token-based tracking
- Public `/survey/respond/:token` route: records `opened_at`, redirects to Tally form
- `sendSurveyCampaign()` generates unique tokens and sends personalized emails
- `trackSurveyOpen` server function (no auth required — public)

---

## May 25, 2026 (early)

### Email Templates
- 4 static HTML email templates: Mentorship Invite, Newsletter, Event Invite, Survey Request
- Template picker with grid/list view toggle; "Start blank" option
- `wrap()`, `btn()`, `card()`, `accentCard()`, `divider()`, `p()`, `h1()`, `h2()`, `eyebrow()` HTML helpers
- UWW purple (`#4B2E83`) header, 600px responsive layout, inline styles for email clients
- `{{first_name}}`, `{{graduation_year}}`, `{{survey_link}}` auto-replaced at send time
- Manual placeholders (amber): `{{event_name}}`, `{{rsvp_url}}`, etc.
- `PlaceholderHints` bar shows which placeholders are in the body and their replacement mode

### Resend Email Integration
- `sendPersonalizedBatch()` in `email.server.ts`
- Graceful degradation when `RESEND_API_KEY` not set (survey links generated, emails skipped)

### `tally_form_id` Added to Surveys
- Migration `20260525120000` adds `tally_form_id` column to surveys table

---

## May 24, 2026

### Alumni Mentorship Sessions
- `survey_responses` FK constraints and indexes
- Indexes on `audit_logs`, `surveys`, `survey_responses`
- Alumni email unique constraint (`lower(email)`)

---

## May 23, 2026

### Initial Foundation
- Core schema: `profiles`, `alumni`, `campaigns`, `surveys`, `survey_responses`, `audit_logs`
- Supabase migration from Lovable-managed project to self-owned `lahnnjgugabyqtnkhtgd`
- Auth: email/password, `handle_new_user` trigger creates profile on signup
- `is_admin()` Postgres security-definer function
- RLS policies on all tables
- Admin account seeded (migration `20260523163711`)
- Alumni CRUD (list, create, edit, archive)
- Campaign CRUD (email campaigns, audience filters, send)
- Survey CRUD (Tally.so integration)
- User management (invite, disable, reactivate, delete)
- Audit log (paginated, filterable)
- Dashboard stats
- ⌘K command palette
- Sidebar navigation
- Dark/light theme
- CSV import for alumni bulk upload
