# Permissions Reference

Complete access control matrix for the UWW CS Alumni CRM.

---

## User States

```
invited → active → disabled
                ↘ deleted
```

- Only `active` users can log in and use the app
- `invited` users have a pending auth invite but cannot access the app yet
- `disabled` and `deleted` users are blocked at the auth layer

---

## Role Definitions

| Role | Who | How assigned |
|------|-----|-------------|
| `admin` | Department administrator (one account) | Seeded in DB migration; promoted manually |
| `user` | Faculty or student | Default when admin creates new user |

There is exactly one admin account. Users cannot self-promote.

---

## Auth Helper Functions (Frontend)

`src/lib/auth.tsx`:

| Function | Returns true when |
|----------|-------------------|
| `isActive(user)` | user exists AND `status === "active"` |
| `canEdit(user)` | `isActive(user)` AND `account_role === "admin"` |

Use `isActive` for route guards on user-accessible pages.
Use `canEdit` for route guards on admin-only pages and for showing mutation buttons.

---

## Route Access

| Route | Minimum role | Notes |
|-------|-------------|-------|
| `/login` | Public | |
| `/survey/respond/:token` | Public | No auth required |
| `/dashboard` | active user | |
| `/alumni` | active user | Read only for non-admins |
| `/alumni/new` | admin | |
| `/alumni/:id` | active user | |
| `/alumni/:id/edit` | admin | |
| `/mentorship` | active user | |
| `/campaigns` | active user | |
| `/campaigns/new` | active user | Non-admins skip template picker |
| `/campaigns/:id` | active user | Send/delete/edit: admin only |
| `/campaigns/:id/edit` | admin | |
| `/surveys` | active user | Read only for non-admins |
| `/surveys/new` | admin | |
| `/surveys/:id` | active user | |
| `/surveys/:id/edit` | admin | |
| `/settings/users` | admin | |
| `/settings/users/new` | admin | |
| `/settings/audit-log` | admin | |
| `/settings/help-content` | admin | |

---

## Feature Access Matrix

| Feature | Admin | Active user |
|---------|-------|-------------|
| View alumni list and detail | ✓ | ✓ |
| Create / edit / archive alumni | ✓ | — |
| Bulk import alumni (CSV) | ✓ | — |
| View mentorship directory | ✓ | ✓ |
| View campaigns list and detail | ✓ | ✓ |
| Create email campaign | ✓ | — |
| Create survey campaign | ✓ | ✓ |
| Edit / delete / send campaign | ✓ | — |
| View surveys list and detail | ✓ | ✓ |
| Create / edit / delete survey | ✓ | — |
| View survey recipients tracking | ✓ | ✓ |
| View help content | ✓ | ✓ |
| Edit help content | ✓ | — |
| Invite / manage users | ✓ | — |
| View audit log | ✓ | — |
| ⌘K command palette | ✓ | ✓ |
| Dark/light theme toggle | ✓ | ✓ |

---

## Sidebar Visibility

| Section | Item | Visible to |
|---------|------|-----------|
| Overview | Dashboard | admin, user |
| Alumni | Alumni | admin, user |
| Alumni | Mentorship | admin, user |
| Outreach | Campaigns | admin, user |
| Outreach | Surveys | admin, user |
| Settings | Users | admin |
| Settings | Audit log | admin |
| Docs | Help content | admin |

---

## Server Function Permission Enforcement

All server functions require a valid Supabase session (`requireSupabaseAuth` middleware).
Admin-only operations additionally call `assertCallerIsAdmin`.

The hierarchy for `createCampaign`:
```ts
if (data.type === "email") {
  await assertCallerIsAdmin(supabase, userId);
  // throws if not admin
}
// survey type: any active user continues
```

**Never rely on frontend route guards alone.** The server function is the authoritative enforcement point.

---

## Database RLS

RLS is enabled on all tables. Even if a server function accidentally skips an auth check, Postgres enforces the policy.

| Table | Non-admin authenticated read | Admin | Notes |
|-------|------------------------------|-------|-------|
| `profiles` | Own row only | All | `is_admin()` in policy |
| `alumni` | All rows | All | |
| `campaigns` | All rows | All | |
| `surveys` | All rows | All | |
| `survey_recipients` | — | All | No user SELECT policy |
| `survey_responses` | — | All | |
| `audit_logs` | — | Read | Append-only via service role |
| `help_content` | All rows | All (via service role) | |

`survey_recipients` has no authenticated-user SELECT policy — access is via server functions that use the service role.

---

## Protected Fields

These fields must never be changed without explicit approval:

| Field | Table | Why |
|-------|-------|-----|
| `account_role` | `profiles` | Changing to `admin` would escalate privileges |
| `status` | `profiles` | Status changes go through designated server functions only |

The `profiles_self_update` RLS policy prevents users from changing their own `account_role`:
```sql
with check (id = auth.uid()
  and account_role = (select account_role from profiles where id = auth.uid()))
```
