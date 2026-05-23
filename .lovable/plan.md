
# Plan

Two phases. Phase A is a focused, mock-only refactor we do now. Phase B is the Supabase backend integration, queued behind your approval.

---

## Phase A — Role model + Department Users page (mock only, do now)

Scope is intentionally narrow. The rest of the app (Dashboard, Alumni, Mentorship, Campaigns, Surveys, layout, theme) is not touched.

### A1. New role model in mocks

Update `src/mocks/data.ts` and `src/mocks/index.ts`:

- Replace `Role` type with:
  - `AccountRole = 'super_admin' | 'staff'`
  - `DepartmentRole = 'faculty' | 'student'`
- Extend `Profile`:
  - `account_role: AccountRole`
  - `department_role: DepartmentRole | null` (required when staff, null allowed for super_admin)
  - `status: 'invited' | 'active' | 'disabled' | 'deleted'`
  - `invited_at`, `accepted_at`, `disabled_at`, `deleted_at`, `last_sign_in_at` (all nullable ISO strings)
- Rewrite `MOCK_USERS` to include:
  - 1 active super_admin (the current "you")
  - 2 active staff/faculty
  - 2 active staff/student
  - 1 invited staff (no accepted_at)
  - 1 disabled staff
- Remove all old `admin` / `faculty` / `student` *account* role references from mock data.

### A2. Auth + access helpers

Update `src/lib/auth.tsx`:

- Replace mock `signIn(role)` / `switchRole(role)` with a single switcher that picks from the new accounts: `super_admin`, `staff (faculty)`, `staff (student)`, `invited`, `disabled`.
- Rewrite `canAccess(user, route)`:
  - `super_admin`: all routes
  - `staff` (any department_role): `/dashboard`, `/alumni*`, `/mentorship*` only
  - `invited` / `disabled` / `deleted`: no protected route; bounced to `/login`
- `canEdit` → keep, return true only for `super_admin` (the only admin role now).
- `AppShell` redirect logic stays; just consumes the new helper.

### A3. Sidebar visibility

Update `src/components/layout/Sidebar.tsx`:

- Filter `NAV` against `account_role`:
  - super_admin: Dashboard, Alumni, Mentorship, Campaigns, Surveys, Users, Audit Log
  - staff: Dashboard, Alumni, Mentorship
- Rebuild the "View as" switcher with the 5 new mock identities listed above (label them clearly, e.g. "Super Admin", "Staff — Faculty", "Staff — Student", "Invited (no access)", "Disabled (no access)").
- Show `department_role` as a small mono badge under the user name when present.

### A4. Department Users page (`/settings/users`)

Rewrite `src/routes/_app.settings.users.tsx`:

- Page title: **Department Users**.
- Guarded super_admin only (route guard already in `AppShell`; double-check inside the page too).
- Table columns: Name, Email, Account Role, Department Role, Status, Invite Sent At, Accepted At, Last Sign-in, Actions.
- Status pills: `invited` (amber), `active` (green), `disabled` (muted), `deleted` (hidden by default; toggle "Show deleted").
- Filters: status, account_role, department_role, search by name/email.
- Actions menu (per row, gated by status):
  - **invited** → Resend invite, Cancel invite, Edit, Delete
  - **active** → Edit, Disable, Delete
  - **disabled** → Reactivate, Delete
- Top-right primary action: **Invite User**.

### A5. Invite User modal (mock)

New component `src/components/users/InviteUserDialog.tsx`:

- Fields: Full Name, Email, Account Role (`super_admin` | `staff`), Department Role (`faculty` | `student`) — Department Role required only when Account Role = staff, otherwise hidden/disabled.
- Validation (zod): email format, name min 2, conditional department_role.
- On submit (mock): append to `MOCK_USERS` with `status = 'invited'`, `invited_at = now`; toast "Invitation sent to [email]."; write audit log row `user.invited`.

### A6. Edit User modal (mock)

New component `src/components/users/EditUserDialog.tsx`:

- Fields: Full Name, Account Role, Department Role, Status.
- Department Role auto-clears when Account Role flips to super_admin; required when staff.
- On save: mutate mock user; write audit log rows for each changed field (`user.updated`, `user.account_role_changed`, `user.department_role_changed`).

### A7. Mock action guards (enforced client-side in Phase A)

In a small helper `src/lib/user-guards.ts`:

- Cannot delete self.
- Cannot disable self.
- Cannot promote self.
- Cannot remove own super_admin role.
- Cannot delete/disable/demote the **last active super_admin**.

All destructive actions use `AlertDialog` for confirmation. Blocked attempts show a toast and write `permission.denied`.

### A8. Audit log mocks

Update `src/mocks/data.ts` audit actions enum and the Audit Log page filter:

```
user.invited
user.invite_resent
user.invite_cancelled
user.accepted_invite
user.updated
user.account_role_changed
user.department_role_changed
user.disabled
user.reactivated
user.deleted
permission.denied
```

Every Phase A user action writes a row with: actor, actor_role, action, affected_user, before, after, timestamp, summary.

### A9. Login page

Update `src/routes/login.tsx`:

- Replace the role buttons with the 5 mock identities from A3.
- Add a small note: "Invitation-only. No public registration." (no behavior change.)

### Phase A files touched

- `src/mocks/data.ts`, `src/mocks/index.ts`
- `src/lib/auth.tsx`
- `src/lib/user-guards.ts` (new)
- `src/components/layout/Sidebar.tsx`
- `src/routes/_app.settings.users.tsx`
- `src/routes/_app.settings.audit-log.tsx` (filter values only)
- `src/routes/login.tsx`
- `src/components/users/InviteUserDialog.tsx` (new)
- `src/components/users/EditUserDialog.tsx` (new)

Nothing else changes. No Supabase. No Lovable Cloud.

---

## Phase B — Supabase backend (queued, awaits your approval)

Executed only after you reply "approved for Phase B". Order:

### B1. Enable Lovable Cloud

### B2. Schema migration

- `profiles` table exactly as specified:
  - `id uuid pk references auth.users(id) on delete cascade`
  - `full_name text`, `email text unique not null`
  - `account_role text check in ('super_admin','staff')`
  - `department_role text check in ('faculty','student')` nullable
  - `status text check in ('invited','active','disabled','deleted') default 'invited'`
  - `invited_at`, `accepted_at`, `disabled_at`, `deleted_at`, `last_sign_in_at`, `created_at`, `updated_at`
  - CHECK constraint: `(account_role = 'staff' AND department_role IS NOT NULL) OR account_role = 'super_admin'`
- `audit_logs` table with the action enum from A8.
- Domain tables: `alumni`, `campaigns`, `surveys`, `survey_responses`.
- Trigger to set `updated_at` on row updates.

### B3. Roles + RLS

- Security-definer helper: `public.is_super_admin(uid uuid) returns boolean` (reads `profiles.account_role`).
- RLS enabled on every table.
- Policies:
  - `profiles`: user can read own row; super_admin can read/write all. Staff cannot SELECT others.
  - `audit_logs`: super_admin SELECT only; no client INSERT (only edge functions write).
  - `alumni` / `mentorship` data: super_admin all; staff SELECT only.
  - `campaigns` / `surveys` / `survey_responses`: super_admin only.
- Block all writes from `anon`.

### B4. Auth wiring

- Replace mock `AuthProvider` with Supabase Auth (email/password). **Sign-in method still open — see Open question below.**
- Add `attachSupabaseAuth` to `src/start.ts` `functionMiddleware`.
- Add `onAuthStateChange` listener at the root for cache/router invalidation.
- Convert `AppShell` guard into a `_authenticated` layout route with `beforeLoad` redirect.
- First super_admin: created manually via SQL after migration.

### B5. Edge functions

- `invite-user`:
  - Verifies caller is super_admin (via JWT + `is_super_admin`).
  - Validates input (zod); enforces conditional department_role.
  - Inserts/updates `profiles` with `status='invited'`, `invited_at=now()`.
  - Calls `supabase.auth.admin.inviteUserByEmail`.
  - Writes `user.invited` audit log.
- `manage-user`:
  - Verifies caller is super_admin.
  - Handles: edit profile, change account_role, change department_role, disable, reactivate, delete, resend invite, cancel invite.
  - Enforces: no self-delete, no self-disable, no self-promote, last-active-super_admin invariant.
  - Writes the corresponding audit log row for each action.
- On invite acceptance (Supabase auth event → DB trigger or function): set `status='active'`, `accepted_at=now()`.

### B6. Replace mocks with server functions (`createServerFn`)

One vertical at a time, in this order:

1. Department Users page → `invite-user` / `manage-user`
2. Alumni list + CRUD + CSV import
3. Dashboard analytics
4. Campaigns
5. Surveys + response import
6. Audit Log viewer (super_admin only)

### B7. QA matrix

Walk every page as super_admin, staff/faculty, staff/student, invited, disabled — confirm sidebar, route guards, and RLS all behave per spec.

---

## Open question (Phase B, not blocking Phase A)

Which sign-in methods do you want for real auth?

- Email + password (simplest, recommended default for an invite-only internal tool)
- Magic link (passwordless email)
- Google via Lovable broker (one-click UWW Google)

Pick any combination. I'll lock this in before starting B4.

---

## What we do next

On your "go", I switch to build mode and execute **Phase A only** (sections A1–A9). Phase B stays queued until you explicitly approve.
