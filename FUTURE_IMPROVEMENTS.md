# Future Improvements

Backlog of ideas and improvements. Not committed to, not prioritized.
Move items to `IMPLEMENTATION_STATUS.md` when work begins.

---

## High Priority

### Regenerate Supabase TypeScript Types
The generated `types.ts` is outdated — it doesn't know about columns added in recent migrations (`tally_form_id` on surveys, `survey_id` on campaigns). Currently worked around with `(supabaseAdmin as any)` casts.
```bash
npx supabase gen types typescript --project-id lahnnjgugabyqtnkhtgd > src/integrations/supabase/types.ts
```
Run this and fix any resulting type errors. Should remove all `as any` casts in server functions.

### GitHub Actions CI
- On every PR: `bun install && bun run build && npx tsc --noEmit`
- Blocks merge if build or type-check fails
- Cheap to set up, high value

---

## Medium Priority

### Alumni Bulk Export
CSV download of the filtered alumni list. Useful for reports and mail merges outside the app.
- Button on alumni list: "Export CSV"
- Respects current search/filter state
- Columns: name, email, company, job_title, graduation_year, industry, tags, mentorship_interest

### Email Open/Click Tracking (Resend Webhooks)
Resend supports delivery webhooks. Could track:
- Email delivered
- Email opened (via tracking pixel)
- Link clicked
Store events on `campaigns` or a new `campaign_events` table.

### Campaign Scheduling
Allow admins to set a future send time on a draft campaign.
- Add `scheduled_for timestamptz` on campaigns
- A Supabase Edge Function or cron job checks and fires at the right time
- Status transitions: `draft` → `scheduled` → `sending` → `sent`

### Survey Response Detail View
Currently `survey_responses` are stored but only the count is displayed.
Add a detail view showing each response row with submission date and alumni name.

### Alumni Bulk Actions
- Select multiple rows → bulk archive
- Select multiple rows → bulk tag edit (already exists as a dialog, consider making it inline)
- Select multiple rows → add to campaign audience manually

### Mentorship Session Notes
Admins can add notes to a mentorship session (topics covered, outcome, next steps).
Stored as `notes text` on `mentorship_sessions`.

---

## Low Priority / Ideas

### Public Alumni Directory
A public-facing page showing opted-in alumni profiles. Would require:
- New `public_visible` boolean on alumni
- Public RLS policy or separate read-only token
- Separate route outside the `_app` shell

### Email Template Editor (UI)
Replace the raw HTML textarea with a block-based editor (e.g. react-email components in a WYSIWYG).
Complex to implement correctly; the current template + preview system covers most needs.

### Tally.so Webhook Signature Verification
The survey response webhook currently trusts all incoming payloads. Verify the Tally webhook signature header before inserting responses.

### Alumni Duplicate Detection
When importing CSV or creating manually, flag potential duplicates (same name or similar email).

### Notifications / In-App Alerts
Toast or badge when a survey campaign crosses a response threshold.

### Multi-language Support
Not needed now but the `help_content` system could support `locale` as a composite key to store translations.

### Remove `@lovable.dev/vite-tanstack-config`
Replace with `@tanstack/start-vite-plugin` directly. The Lovable-managed package works today but could go stale if Lovable deprecates it. Not urgent.

### Seed Script
A `supabase/seed.sql` or a `scripts/seed.ts` that creates representative test data (alumni, campaigns, surveys). Useful for new dev setups.
