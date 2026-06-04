import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AccountRole, UserCategory, Profile, UserStatus } from "@/mocks";

export type EditPayload = {
  full_name: string;
  account_role: AccountRole;
  user_category: UserCategory | null;
  status: Extract<UserStatus, "invited" | "active" | "disabled">;
};

export function EditUserDialog({
  user,
  isSelf,
  onSubmit,
  onCancel,
}: {
  user: Profile;
  isSelf?: boolean;
  onSubmit: (p: EditPayload) => void;
  onCancel: () => void;
}) {
  const [fullName, setFullName] = useState(user.full_name);
  const [role, setRole] = useState<AccountRole>(user.account_role);
  const [userCategory, setUserCategory] = useState<UserCategory>(user.user_category ?? "faculty");
  const [status, setStatus] = useState<EditPayload["status"]>(
    user.status === "deleted" ? "disabled" : (user.status as EditPayload["status"]),
  );
  const [error, setError] = useState<string | null>(null);

  function handle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2) return setError("Full name is required.");
    onSubmit({
      full_name: fullName.trim(),
      account_role: role,
      user_category: role === "admin" ? null : userCategory,
      status,
    });
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit User</DialogTitle>
      </DialogHeader>
      <form onSubmit={handle} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={user.email} disabled />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AccountRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {isSelf && role === "user" && (
              <p className="text-xs text-destructive">You will lose admin access.</p>
            )}
          </div>
          {role === "user" && (
            <div className="space-y-1.5">
              <Label>User category</Label>
              <Select value={userCategory} onValueChange={(v) => setUserCategory(v as UserCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Access state</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as EditPayload["status"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
