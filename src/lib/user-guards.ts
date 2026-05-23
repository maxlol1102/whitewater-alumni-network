import type { Profile, UserCategory } from "@/mocks";

export type GuardResult = { ok: true } | { ok: false; reason: string };

function ok(): GuardResult { return { ok: true }; }
function no(reason: string): GuardResult { return { ok: false, reason }; }

export function guardDelete(actor: Profile, target: Profile): GuardResult {
  if (actor.id === target.id) return no("You cannot delete your own account.");
  if (target.account_role === "admin") return no("The admin account cannot be deleted.");
  return ok();
}

export function guardDisable(actor: Profile, target: Profile): GuardResult {
  if (actor.id === target.id) return no("You cannot disable your own account.");
  if (target.account_role === "admin") return no("The admin account cannot be disabled.");
  return ok();
}

export function guardEdit(
  actor: Profile,
  target: Profile,
  nextCategory: UserCategory | null,
): GuardResult {
  if (target.account_role === "admin" && actor.id !== target.id) {
    return no("The admin account can only be edited by itself.");
  }
  if (target.account_role === "user" && !nextCategory) {
    return no("Users require a category (faculty or student).");
  }
  return ok();
}
