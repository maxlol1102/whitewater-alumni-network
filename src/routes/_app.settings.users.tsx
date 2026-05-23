import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, MoreHorizontal, Search } from "lucide-react";
import { Breadcrumbs, PageContainer, PageHeader } from "@/components/layout/Page";
import { MOCK_USERS, type Profile, type AccountRole, type UserCategory, type UserStatus } from "@/mocks";
import { useAuth } from "@/lib/auth";
import { guardDelete, guardDisable, guardEdit } from "@/lib/user-guards";
import { InviteUserDialog, type InvitePayload } from "@/components/users/InviteUserDialog";
import { EditUserDialog, type EditPayload } from "@/components/users/EditUserDialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings/users")({ component: UsersPage });

const ACCOUNT_LABEL: Record<AccountRole, string> = { admin: "Admin", user: "User" };
const CATEGORY_LABEL: Record<UserCategory, string> = { faculty: "Faculty", student: "Student" };
const STATUS_STYLES: Record<UserStatus, string> = {
  invited: "bg-amber-100 text-amber-800 border-amber-200",
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  disabled: "bg-muted text-muted-foreground border-transparent",
  deleted: "bg-destructive/10 text-destructive border-destructive/20",
};

type ActionType = "disable" | "reactivate" | "delete" | "resend" | "cancel_invite" | null;

function fmtDate(d: string | null) { return d ? new Date(d).toLocaleDateString() : "—"; }

function UsersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user && user.account_role !== "admin") navigate({ to: "/dashboard" }); }, [user, navigate]);

  const [users, setUsers] = useState<Profile[]>(MOCK_USERS);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [actionUser, setActionUser] = useState<Profile | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  // Filters
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState<string>("all");
  const [fCategory, setFCategory] = useState<string>("all");

  const rows = useMemo(() => users.filter((u) => {
    if (!showDeleted && u.status === "deleted") return false;
    if (fStatus !== "all" && u.status !== fStatus) return false;
    if (fCategory !== "all") {
      if (fCategory === "admin" ? u.account_role !== "admin" : u.user_category !== fCategory) return false;
    }
    if (q && !`${u.full_name} ${u.email}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [users, showDeleted, fStatus, fCategory, q]);

  if (!user) return null;

  function audit(action: string, summary: string) {
    // Phase A: mock audit recording. Phase B writes to audit_logs via edge fn.
    // eslint-disable-next-line no-console
    console.info(`[audit] ${action} — ${summary}`);
  }

  function handleInvite(p: InvitePayload) {
    if (users.some((u) => u.email.toLowerCase() === p.email)) {
      toast.error("A user with that email already exists.");
      return;
    }
    const now = new Date().toISOString();
    const newUser: Profile = {
      id: `u-${Math.random().toString(36).slice(2, 8)}`,
      full_name: p.full_name,
      email: p.email,
      account_role: "user",
      user_category: p.user_category,
      status: p.status,
      invited_at: now,
      accepted_at: p.status === "active" ? now : null,
      disabled_at: p.status === "disabled" ? now : null,
      deleted_at: null,
      last_sign_in_at: null,
      created_at: now,
    };
    setUsers((prev) => [newUser, ...prev]);
    audit("user.invited", `Created ${p.email} as ${p.user_category} (${p.status})`);
    if (p.status === "invited") toast.success(`Invitation sent to ${p.email}.`);
    else toast.success(`User ${p.email} created.`);
    setInviteOpen(false);
  }

  function handleEdit(target: Profile, p: EditPayload) {
    const check = guardEdit(user!, target, p.user_category);
    if (!check.ok) {
      audit("permission.denied", check.reason);
      toast.error(check.reason);
      return;
    }
    const before = { full_name: target.full_name, user_category: target.user_category, status: target.status };
    setUsers((prev) => prev.map((x) => x.id === target.id ? {
      ...x,
      full_name: p.full_name,
      user_category: p.user_category,
      status: p.status,
      disabled_at: p.status === "disabled" ? (x.disabled_at ?? new Date().toISOString()) : null,
      accepted_at: p.status === "active" && !x.accepted_at ? new Date().toISOString() : x.accepted_at,
    } : x));
    if (before.user_category !== p.user_category) audit("user.category_changed", `${target.email}: ${before.user_category ?? "—"} → ${p.user_category ?? "—"}`);
    if (before.status !== p.status) audit("user.status_changed", `${target.email}: ${before.status} → ${p.status}`);
    if (before.full_name !== p.full_name) audit("user.updated", `${target.email}: profile updated`);
    toast.success("User updated.");
    setEditUser(null);
  }

  function runAction() {
    if (!actionUser || !actionType) return;
    const t = actionUser;
    if (actionType === "delete") {
      const r = guardDelete(user!, t);
      if (!r.ok) { audit("permission.denied", r.reason); toast.error(r.reason); return; }
      setUsers((prev) => prev.map((x) => x.id === t.id ? { ...x, status: "deleted", deleted_at: new Date().toISOString() } : x));
      audit("user.deleted", `Deleted ${t.email}`);
      toast.success("User deleted.");
    } else if (actionType === "disable") {
      const r = guardDisable(user!, t);
      if (!r.ok) { audit("permission.denied", r.reason); toast.error(r.reason); return; }
      setUsers((prev) => prev.map((x) => x.id === t.id ? { ...x, status: "disabled", disabled_at: new Date().toISOString() } : x));
      audit("user.disabled", `Disabled ${t.email}`);
      toast.success("User disabled.");
    } else if (actionType === "reactivate") {
      setUsers((prev) => prev.map((x) => x.id === t.id ? { ...x, status: "active", disabled_at: null } : x));
      audit("user.reactivated", `Reactivated ${t.email}`);
      toast.success("User reactivated.");
    } else if (actionType === "resend") {
      setUsers((prev) => prev.map((x) => x.id === t.id ? { ...x, invited_at: new Date().toISOString() } : x));
      audit("user.invite_resent", `Resent invite to ${t.email}`);
      toast.success(`Invitation resent to ${t.email}.`);
    } else if (actionType === "cancel_invite") {
      setUsers((prev) => prev.filter((x) => x.id !== t.id));
      audit("user.invite_cancelled", `Cancelled invite for ${t.email}`);
      toast.success("Invitation cancelled.");
    }
    setActionUser(null); setActionType(null);
  }

  const actionCopy: Record<Exclude<ActionType, null>, { title: string; desc: string }> = {
    delete: { title: "Delete user?", desc: "This removes the user account. An audit log entry will be recorded." },
    disable: { title: "Disable user?", desc: "The user will lose access to the app until reactivated." },
    reactivate: { title: "Reactivate user?", desc: "The user will regain access to the app immediately." },
    resend: { title: "Resend invitation?", desc: "A new invitation email will be sent." },
    cancel_invite: { title: "Cancel invitation?", desc: "The pending invitation will be revoked." },
  };

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Settings" }, { label: "Users" }]} />
      <PageHeader
        eyebrow="01 · Access"
        title="Users"
        description="One admin manages the platform. All other accounts are users, categorized as faculty or student."
        actions={
          <Button onClick={() => setInviteOpen(true)}><UserPlus className="size-4" />Create User</Button>
        }
      />

      <Card className="p-4 mb-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className="pl-8" />
          </div>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={fCategory} onValueChange={setFCategory}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
              <SelectItem value="student">Student</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Switch id="show-deleted" checked={showDeleted} onCheckedChange={setShowDeleted} />
          <Label htmlFor="show-deleted" className="text-xs text-muted-foreground">Show deleted</Label>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invite Sent</TableHead>
              <TableHead>Accepted</TableHead>
              <TableHead>Last Sign-in</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((u) => {
              const isSelf = user.id === u.id;
              const isAdmin = u.account_role === "admin";
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.full_name} {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{u.email}</TableCell>
                  <TableCell><Badge variant={isAdmin ? "default" : "outline"}>{ACCOUNT_LABEL[u.account_role]}</Badge></TableCell>
                  <TableCell>{u.user_category ? <Badge variant="secondary">{CATEGORY_LABEL[u.user_category]}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell><Badge className={STATUS_STYLES[u.status]}>{u.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-xs">{fmtDate(u.invited_at)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{fmtDate(u.accepted_at)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{fmtDate(u.last_sign_in_at)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isAdmin ? (
                          <DropdownMenuItem disabled>Admin account is protected</DropdownMenuItem>
                        ) : u.status === "invited" ? (
                          <>
                            <DropdownMenuItem onClick={() => { setActionUser(u); setActionType("resend"); }}>Resend invite</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setActionUser(u); setActionType("cancel_invite"); }}>Cancel invite</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditUser(u)}>Edit user</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => { setActionUser(u); setActionType("delete"); }}>Delete</DropdownMenuItem>
                          </>
                        ) : u.status === "active" ? (
                          <>
                            <DropdownMenuItem onClick={() => setEditUser(u)}>Edit user</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setActionUser(u); setActionType("disable"); }}>Disable</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => { setActionUser(u); setActionType("delete"); }}>Delete</DropdownMenuItem>
                          </>
                        ) : u.status === "disabled" ? (
                          <>
                            <DropdownMenuItem onClick={() => { setActionUser(u); setActionType("reactivate"); }}>Reactivate</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => { setActionUser(u); setActionType("delete"); }}>Delete</DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem disabled>Deleted</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {rows.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No users match your filters.</div>}
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <InviteUserDialog onSubmit={handleInvite} onCancel={() => setInviteOpen(false)} />
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        {editUser && <EditUserDialog user={editUser} onSubmit={(p) => handleEdit(editUser, p)} onCancel={() => setEditUser(null)} />}
      </Dialog>

      <AlertDialog open={!!actionType} onOpenChange={(o) => { if (!o) { setActionUser(null); setActionType(null); } }}>
        <AlertDialogContent>
          {actionType && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{actionCopy[actionType].title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {actionCopy[actionType].desc}
                  {actionUser && <span className="block mt-2 font-mono text-xs">{actionUser.email}</span>}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={runAction}>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
