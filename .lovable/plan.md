## CRUD audit

| Entity | Backend | Notes |
|---|---|---|
| Alumni | ✅ list, get, create, update, archive/unarchive, delete, CSV import | Wired to DB |
| Campaigns | ✅ list, get, create, update, delete, send, previewRecipients | Wired to DB |
| Users (profiles) | ✅ list, invite, update, disable, reactivate, delete, resend/cancel invite | Wired to DB |
| Dashboard | ✅ getDashboardStats | Wired to DB |
| **Surveys** | ❌ **No server functions** — entire UI reads MOCK_SURVEYS / MOCK_SURVEY_RESPONSES | DB tables exist (`surveys`, `survey_responses`) with RLS, but unused |
| **Audit log** | ❌ Reads MOCK_AUDIT_LOGS | DB table `audit_logs` exists with admin RLS, but nothing writes or reads from it |
| Mentorship | ⚠️ Reads MOCK_ALUMNI | Should derive from alumni server fn (cosmetic — same data shape) |
| SurveyForm campaign picker | ⚠️ Uses MOCK_CAMPAIGNS | Should use `listCampaigns` |

## Plan

### 1. Surveys CRUD (the real gap)
Create `src/lib/surveys.functions.ts` with:
- `listSurveys` — joins linked campaign name + accurate `response_count`
- `getSurvey(id)`
- `createSurvey({ title, form_url, description, campaign_id? })`
- `updateSurvey({ id, ...fields })`
- `deleteSurvey(id)`
- `listSurveyResponses(survey_id)` — joins alumni name/email when matched

All `.middleware([requireSupabaseAuth])`, RLS already restricts to admin.

Wire into:
- `src/routes/_app.surveys.index.tsx` — replace MOCK with `useServerFn(listSurveys)` + query.
- `src/routes/_app.surveys.$id.tsx` — replace MOCK with `getSurvey` + `listSurveyResponses`; add Delete button (mutation → invalidate + nav back).
- `src/routes/_app.surveys.$id.edit.tsx` — load via `getSurvey`.
- `src/components/surveys/SurveyForm.tsx` — call `createSurvey` / `updateSurvey`; replace MOCK_CAMPAIGNS dropdown with `listCampaigns` server fn.
- Convert "Create survey" to a **modal** on the index page (consistent with the campaigns pattern just shipped).

### 2. Audit log — read from DB
Create `src/lib/audit.functions.ts`:
- `listAuditLogs({ actor_id?, action?, entity_type?, q?, from?, to? })` — server-side filtering, capped to 500 rows.

Wire into `src/routes/_app.settings.audit-log.tsx` — replace MOCK_AUDIT_LOGS with query, replace MOCK_USERS in actor filter with `listUsers`.

No write API needed yet (no current mutations log to it); writes can be added later when we instrument server fns.

### 3. Mentorship — use real alumni
Replace `MOCK_ALUMNI` in `_app.mentorship.tsx` with `useServerFn(listAlumni)` and filter client-side (`mentorship_interest && !archived`). No new server fn needed.

### Out of scope
- Auto-writing audit log entries from existing mutations (separate, larger task).
- Survey response ingestion (no inbound webhook yet).
- Profile self-edit (RLS already allows; not requested).
