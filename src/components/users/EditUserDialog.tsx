import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AccountRole, DepartmentRole, Profile, UserStatus } from "@/mocks";

export type EditPayload = {
  full_name: string;
  account_role: AccountRole;
  department_role: DepartmentRole | null;
  status: UserStatus;
};

export function EditUserDialog({ user, onSubmit, onCancel }: { user: Profile; onSubmit: (p: EditPayload) => void; onCancel: () => void }) {
  const [fullName, setFullName] = useState(user.full_name);
  const [accountRole, setAccountRole] = useState<AccountRole>(user.account_role);
  const [departmentRole, setDepartmentRole] = useState<DepartmentRole>(user.department_role ?? "faculty");
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [error, setError] = useState<string | null>(null);

  function handle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2) return setError("Full name is required.");
    onSubmit({
      full_name: fullName.trim(),
      account_role: accountRole,
      department_role: accountRole === "staff" ? departmentRole : null,
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
            <Label>Account role</Label>
            <Select value={accountRole} onValueChange={(v) => setAccountRole(v as AccountRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {accountRole === "staff" && (
            <div className="space-y-1.5">
              <Label>Department role</Label>
              <Select value={departmentRole} onValueChange={(v) => setDepartmentRole(v as DepartmentRole)}>
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
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as UserStatus)}>
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
