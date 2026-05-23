import type { Profile, AccountRole, DepartmentRole } from "@/mocks";

export type GuardResult = { ok: true } | { ok: false; reason: string };

function ok(): GuardResult { return { ok: true }; }
function no(reason: string): GuardResult { return { ok: false, reason }; }

export function activeSuperAdminCount(users: Profile[], excludeId?: string): number {
  return users.filter(
    (u) => u.id !== excludeId && u.account_role === "super_admin" && u.status === "active",
  ).length;
}

export function guardDelete(actor: Profile, target: Profile, users: Profile[]): GuardResult {
  if (actor.id === target.id) return no("You cannot delete your own account.");
  if (target.account_role === "super_admin" && activeSuperAdminCount(users, target.id) < 1) {
    return no("At least one active super admin must remain.");
  }
  return ok();
}

export function guardDisable(actor: Profile, target: Profile, users: Profile[]): GuardResult {
  if (actor.id === target.id) return no("You cannot disable your own account.");
  if (target.status === "active" && target.account_role === "super_admin" && activeSuperAdminCount(users, target.id) < 1) {
    return no("At least one active super admin must remain.");
  }
  return ok();
}

export function guardRoleChange(
  actor: Profile,
  target: Profile,
  nextAccountRole: AccountRole,
  nextDepartmentRole: DepartmentRole | null,
  users: Profile[],
): GuardResult {
  // Cannot promote self to super_admin
  if (actor.id === target.id && target.account_role !== "super_admin" && nextAccountRole === "super_admin") {
    return no("You cannot promote yourself to super admin.");
  }
  // Cannot demote self from super_admin
  if (actor.id === target.id && target.account_role === "super_admin" && nextAccountRole !== "super_admin") {
    return no("You cannot remove your own super admin role.");
  }
  // Last-super-admin invariant
  if (target.account_role === "super_admin" && nextAccountRole !== "super_admin" && activeSuperAdminCount(users, target.id) < 1) {
    return no("At least one active super admin must remain.");
  }
  // Staff requires department_role
  if (nextAccountRole === "staff" && !nextDepartmentRole) {
    return no("Staff users require a department role (faculty or student).");
  }
  return ok();
}
