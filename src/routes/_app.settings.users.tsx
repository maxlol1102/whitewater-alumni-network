import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, MoreHorizontal } from "lucide-react";
import { Breadcrumbs, PageContainer, PageHeader } from "@/components/layout/Page";
import { MOCK_USERS, type Profile, type Role } from "@/mocks";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings/users")({ component: UsersPage });

const ROLE_LABEL: Record<Role, string> = { super_admin: "Super Admin", admin: "Admin", faculty: "Faculty" };
const ROLE_STYLES: Record<Role, string> = {
  super_admin: "bg-primary/10 text-primary border-primary/20",
  admin: "bg-blue-100 text-blue-800 border-blue-200",
  faculty: "bg-muted text-muted-foreground border-transparent",
};

function UsersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user && user.role !== "super_admin") navigate({ to: "/dashboard" }); }, [user, navigate]);
  const [users, setUsers] = useState<Profile[]>(MOCK_USERS);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [actionUser, setActionUser] = useState<Profile | null>(null);
  const [actionType, setActionType] = useState<"disable" | "reactivate" | "delete" | null>(null);

  const superAdminCount = users.filter((u) => u.role === "super_admin" && !u.disabled_at).length;

  function isSelf(u: Profile) { return user?.id === u.id; }

  function changeRole(u: Profile, role: Role) {
    if (isSelf(u) && role === "super_admin" && u.role !== "super_admin") {
      toast.error("You cannot promote yourself to super admin");
      return;
    }
    if (u.role === "super_admin" && role !== "super_admin" && superAdminCount <= 1) {
      toast.error("At least one super admin must remain");
      return;
    }
    setUsers((list) => list.map((x) => x.id === u.id ? { ...x, role } : x));
    toast.success(`Role changed to ${ROLE_LABEL[role]} (mock)`);
  }

  function confirmAction() {
    if (!actionUser || !actionType) return;
    if (isSelf(actionUser)) { toast.error("You cannot perform this action on yourself"); return; }
    if (actionUser.role === "super_admin" && (actionType === "disable" || actionType === "delete") && superAdminCount <= 1) {
      toast.error("At least one super admin must remain"); return;
    }
    setUsers((list) => {
      if (actionType === "delete") return list.filter((x) => x.id !== actionUser.id);
      if (actionType === "disable") return list.map((x) => x.id === actionUser.id ? { ...x, disabled_at: new Date().toISOString() } : x);
      if (actionType === "reactivate") return list.map((x) => x.id === actionUser.id ? { ...x, disabled_at: null } : x);
      return list;
    });
    toast.success(`User ${actionType} (mock) — audit log entry recorded`);
    setActionUser(null); setActionType(null);
  }

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Settings" }, { label: "Users" }]} />
      <PageHeader title="Users" description="Manage staff accounts for the alumni platform." actions={
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild><Button><UserPlus className="size-4" />Invite user</Button></DialogTrigger>
          <InviteDialog onDone={() => setInviteOpen(false)} />
        </Dialog>
      } />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last sign-in</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name} {isSelf(u) && <span className="text-xs text-muted-foreground">(you)</span>}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell><Badge className={ROLE_STYLES[u.role]}>{ROLE_LABEL[u.role]}</Badge></TableCell>
                <TableCell>{u.disabled_at ? <Badge variant="destructive">Disabled</Badge> : <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Active</Badge>}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-muted-foreground">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "—"}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">Change role</div>
                      {(["super_admin", "admin", "faculty"] as Role[]).map((r) => (
                        <DropdownMenuItem key={r} disabled={u.role === r} onClick={() => changeRole(u, r)}>{ROLE_LABEL[r]}</DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      {u.disabled_at ? (
                        <DropdownMenuItem onClick={() => { setActionUser(u); setActionType("reactivate"); }}>Reactivate</DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem disabled={isSelf(u)} onClick={() => { setActionUser(u); setActionType("disable"); }}>Disable</DropdownMenuItem>
                      )}
                      <DropdownMenuItem disabled={isSelf(u)} className="text-destructive" onClick={() => { setActionUser(u); setActionType("delete"); }}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={!!actionType} onOpenChange={(o) => { if (!o) { setActionUser(null); setActionType(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "delete" && `Delete ${actionUser?.full_name}?`}
              {actionType === "disable" && `Disable ${actionUser?.full_name}?`}
              {actionType === "reactivate" && `Reactivate ${actionUser?.full_name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "delete" && "This will remove the user's account. In Phase B this will run through a secure Edge Function and write an audit log entry."}
              {actionType === "disable" && "The user will lose access to the app until reactivated."}
              {actionType === "reactivate" && "The user will regain access to the app immediately."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

function InviteDialog({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("faculty");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !name) { toast.error("Email and name are required"); return; }
    toast.success(`Invitation sent to ${email} (mock)`);
    onDone();
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Invite a new user</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
          <Button type="submit">Send invite</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
