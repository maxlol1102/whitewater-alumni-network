import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { UserCategory, Profile, UserStatus } from "@/mocks";

export type EditPayload = {
  full_name: string;
  user_category: UserCategory | null;
  status: Extract<UserStatus, "invited" | "active" | "disabled">;
};

export function EditUserDialog({ user, onSubmit, onCancel }: { user: Profile; onSubmit: (p: EditPayload) => void; onCancel: () => void }) {
  const isAdmin = user.account_role === "admin";
  const [fullName, setFullName] = useState(user.full_name);
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
      user_category: isAdmin ? null : userCategory,
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
            <Input value={isAdmin ? "Admin" : "User"} disabled />
          </div>
          {!isAdmin && (
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
          <Select value={status} onValueChange={(v) => setStatus(v as EditPayload["status"])} disabled={isAdmin}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && <p className="text-xs text-muted-foreground">The admin account is always active.</p>}
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
