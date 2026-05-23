import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { AccountRole, UserCategory } from "@/mocks";

export type InvitePayload = {
  full_name: string;
  email: string;
  account_role: AccountRole;
  user_category: UserCategory | null;
};

export function InviteUserDialog({ onSubmit, onCancel }: { onSubmit: (p: InvitePayload) => void; onCancel: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [accountRole, setAccountRole] = useState<AccountRole>("user");
  const [userCategory, setUserCategory] = useState<UserCategory>("faculty");
  const [error, setError] = useState<string | null>(null);

  function handle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2) return setError("Full name is required.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError("Enter a valid email.");
    if (accountRole === "user" && !userCategory) return setError("Department role is required for staff.");
    onSubmit({
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      account_role: accountRole,
      user_category: accountRole === "user" ? userCategory : null,
    });
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Invite User</DialogTitle>
        <DialogDescription>They will receive an invitation email to set their password.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handle} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" required />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@uww.edu" required />
        </div>
        <div className="space-y-1.5">
          <Label>Account role</Label>
          <Select value={accountRole} onValueChange={(v) => setAccountRole(v as AccountRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {accountRole === "user" && (
          <div className="space-y-1.5">
            <Label>Department role</Label>
            <Select value={userCategory} onValueChange={(v) => setUserCategory(v as UserCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="faculty">Faculty</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Invite User</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
