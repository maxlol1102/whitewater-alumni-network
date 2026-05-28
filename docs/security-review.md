# Security Review — UWW Alumni Network

**Date:** 2026-05-26  
**Scope:** Supabase RLS, secrets/environment, server function auth, public endpoints

---

## Summary

| Severity | Finding | Status |
|----------|---------|--------|
| 🔴 Critical | `.env` with live keys was committed to git history | **Action required: rotate keys** |
| 🔴 Critical | Admin password hardcoded in migration file (in git history) | **Action required: change password** |
| 🟠 High | `groups`/`alumni_groups` RLS allowed any authenticated user to write | **Fixed — migration 20260526140000** |
| 🟡 Medium | `trackSurveyOpen` is a public, unauthenticated endpoint | **By design — documented below** |
| 🟡 Medium | No rate limiting on public survey link endpoint | **Recommendation only** |
| 🟢 Low | No `.env.example` for developer onboarding | **Fixed — `.env.example` created** |

---

## 1. Secrets / Git History

### Finding
Commit `d93d190` ("Remove .env from git tracking") removed `.env` from tracking, but the file was already present in earlier commits. The following secrets are in the repository's git history and must be considered **compromised**:

- `SUPABASE_SERVICE_ROLE_KEY` — full database access, bypasses all RLS
- `RESEND_API_KEY` — can send email as your domain

The `.gitignore` is correctly configured (`.env` and `.env.*` are listed). The file is no longer tracked. But git history is permanent until rewritten.

### What to do (required)

**1. Rotate the Supabase service role key**
- Supabase dashboard → Settings → API → Regenerate service role key
- Update your `.env` with the new key

**2. Rotate the Resend API key**
- resend.com → API Keys → Delete the old key → Create a new one
- Update your `.env` with the new key

**3. Remove secrets from git history** (optional but recommended if repo is or will be shared)
```bash
# Install git-filter-repo (brew install git-filter-repo)
git filter-repo --path .env --invert-paths
git push --force-all
```
Note: This rewrites history. All collaborators must re-clone.

### Hardcoded admin password in migration
File: `supabase/migrations/20260523163711_0f04c5c2...sql`, line 26

```sql
crypt('UWWhitewaterCS@2026!Dept', gen_salt('bf'))
```

This password is in git history. Change it immediately:
- Supabase dashboard → Authentication → Users → find `SubediD30@uww.edu` → change password
- Or use the Supabase CLI: `supabase auth admin update-user <uid> --password <new-password>`

---

## 2. Supabase RLS

### All tables audited

| Table | RLS | Write policy |
|-------|-----|-------------|
| `profiles` | ✅ | Own row only (select/update); admin can do all |
| `alumni` | ✅ | Admin only |
| `campaigns` | ✅ | Admin only; read open to all authenticated |
| `surveys` | ✅ | Admin only; read open to all authenticated |
| `survey_responses` | ✅ | Admin only |
| `survey_recipients` | ✅ | Admin only |
| `help_content` | ✅ | Admin only; read open to all authenticated |
| `audit_logs` | ✅ | No write policy (service role only) |
| `groups` | ✅ | **Fixed** — was open to all authenticated |
| `alumni_groups` | ✅ | **Fixed** — was open to all authenticated |

### Fix applied: `20260526140000_tighten_groups_rls.sql`

The original `20260526120000_alumni_groups.sql` migration created policies with `using (true)` for INSERT, UPDATE, and DELETE on both `groups` and `alumni_groups`. This meant any logged-in user (not just admins) could:
- Create, rename, and delete groups
- Add any alumni to any group
- Remove alumni from groups

The fix replaces those policies with `public.is_admin(auth.uid())` checks, matching the pattern used by all other write-capable tables. Read policies remain open to authenticated users because non-admin users need to load group lists for campaign audience filtering.

**Existing server functions already had `assertCallerIsAdmin`** — this is defense-in-depth, not a workaround. Both layers now agree.

---

## 3. Server Function Auth

### Pattern used throughout

All server functions use:
```ts
.middleware([requireSupabaseAuth])   // verifies JWT, loads user context
assertCallerIsAdmin(supabase, userId) // verifies account_role = 'admin'
```

### Audit results

**Correctly open to all authenticated users (read-only):**
- `listAlumni`, `getAlumni` — alumni data is non-sensitive, all staff need it
- `listCampaigns`, `getCampaign` — staff need to view campaigns
- `listSurveys`, `getSurvey` — staff need to view surveys
- `listGroups`, `getGroup` — needed for campaign audience picker
- `getDashboardStats` — aggregate stats, no PII
- `getHelpContent` — help text is not sensitive

**Correctly open to all authenticated users (write):**
- `createCampaign` with `type = "survey"` — intentional; non-admin faculty can create survey campaigns. Email campaigns remain admin-only.
- `previewRecipients` — intentional; non-admins need this when building survey campaigns

**Intentionally public (no auth required):**
- `trackSurveyOpen` — documented below

**All mutations confirmed admin-only:**
`createAlumni`, `updateAlumni`, `archiveAlumni`, `deleteAlumni`, `bulkDeleteAlumni`, `importAlumniCsv`, `updateCampaign`, `deleteCampaign`, `sendCampaign`, `createSurvey`, `updateSurvey`, `deleteSurvey`, `createGroup`, `updateGroup`, `deleteGroup`, `addAlumniToGroup`, `removeAlumniFromGroup`, all user management functions, `upsertHelpContent`, `deleteHelpContent`, `listAuditLogs`

---

## 4. Public Endpoint: `trackSurveyOpen`

### Why it has no auth

When a survey campaign is sent, each recipient gets a unique link:
```
https://app.uww.edu/survey/respond/<uuid-token>
```

The recipient clicks this from their email — they are **not logged in**. The page calls `trackSurveyOpen(token)` to:
1. Mark `survey_recipients.opened_at` (first-open only)
2. Return the Tally form URL for that campaign

This is the same pattern used by every email tracking pixel and survey link tool (Mailchimp, Typeform, etc.). Auth is impossible here by definition.

### What makes this safe

- Tokens are UUIDs (128-bit random) — not guessable or enumerable in practice
- The function returns only `tally_form_url` and `campaign_name` — no alumni PII
- First-open deduplication: `if (!row.opened_at)` means repeated calls are idempotent
- Invalid tokens return `{ ok: false, reason: "invalid_token" }` — no information leak

### Remaining risk: no rate limiting

A high-volume flood of requests to this endpoint (with random tokens) would generate many DB queries. There is no IP-based rate limiting.

**Recommendation:** Add Supabase edge function rate limiting, or configure rate limiting at the CDN/hosting layer (Cloudflare, Vercel, etc.). For a university CRM with O(100s) of survey recipients, this is low priority.

---

## 5. No AI/LLM Features

No AI or LLM features found in the codebase. No prompt injection surface exists.

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/20260526140000_tighten_groups_rls.sql` | **Created** — replaces permissive groups/alumni_groups write policies with admin-only |
| `.env.example` | **Created** — documents required env vars without any actual secrets |
| `docs/security-review.md` | **Created** — this file |

---

## Remaining Recommendations

### Must do (keys are compromised)
1. **Rotate Supabase service role key** in dashboard → update `.env`
2. **Rotate Resend API key** in dashboard → update `.env`
3. **Change admin account password** for `SubediD30@uww.edu`

### Should do
4. **Add rate limiting** to `/survey/respond/:token` — configure at hosting layer
5. **Add token expiry** — add `expires_at` column to `survey_recipients`; reject tokens older than 30 days in `trackSurveyOpen`
6. **Clean git history** if the repo will ever be made public or shared externally

### Nice to have
7. **Audit log retention** — no retention policy exists; logs will grow unbounded
8. **CSP headers** — add `Content-Security-Policy` header to prevent XSS if ever injecting user content into HTML emails

---

## How to Test Security

```bash
# 1. Verify RLS: groups write is admin-only
# Log in as a non-admin user, then try:
curl -X POST https://<project>.supabase.co/rest/v1/groups \
  -H "apikey: <anon-key>" \
  -H "Authorization: Bearer <non-admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name": "test"}'
# Expect: 403 or empty result (RLS blocks it)

# 2. Verify trackSurveyOpen rejects bad tokens
# Call with a random token — should return { ok: false }

# 3. Verify service role key is not in any source file
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" src/
# Expect: no output

# 4. Verify .env is not tracked
git ls-files .env
# Expect: no output

# 5. Run TypeScript check — no unsafe any leaks
npx tsc --noEmit
```
