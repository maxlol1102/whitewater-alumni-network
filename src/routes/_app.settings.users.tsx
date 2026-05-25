import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, MoreHorizontal, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import type { Profile, AccountRole, UserCategory, UserStatus } from "@/mocks";
import { useAuth } from "@/lib/auth";
import { EditUserDialog, type EditPayload } from "@/components/users/EditUserDialog";
import {
  listUsers,
  updateUser,
  disableUser,
  reactivateUser,
  deleteUser,
  resendInvite,
  cancelInvite,
} from "@/lib/users.functions";
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

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

function UsersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user && user.account_role !== "admin") navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const qc = useQueryClient();
  const list = useServerFn(listUsers);
  const update = useServerFn(updateUser);
  const disable = useServerFn(disableUser);
  const reactivate = useServerFn(reactivateUser);
  const remove = useServerFn(deleteUser);
  const resend = useServerFn(resendInvite);
  const cancel = useServerFn(cancelInvite);

  const usersQ = useQuery({
    queryKey: ["users"],
    queryFn: () => list(),
    enabled: !!user && user.account_role === "admin",
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["users"] });

  const editM = useMutation({
    mutationFn: (args: { id: string; payload: EditPayload }) =>
      update({ data: { id: args.id, ...args.payload } }),
    onSuccess: () => {
      toast.success("User updated.");
      setEditUser(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const actionM = useMutation({
    mutationFn: async (args: { type: Exclude<ActionType, null>; id: string }) => {
      switch (args.type) {
        case "disable":
          return disable({ data: { id: args.id } });
        case "reactivate":
          return reactivate({ data: { id: args.id } });
        case "delete":
          return remove({ data: { id: args.id } });
        case "resend":
          return resend({ data: { id: args.id } });
        case "cancel_invite":
          return cancel({ data: { id: args.id } });
      }
    },
    onSuccess: (_d, args) => {
      const msg: Record<Exclude<ActionType, null>, string> = {
        disable: "User disabled.",
        reactivate: "User reactivated.",
        delete: "User deleted.",
        resend: "Invitation resent.",
        cancel_invite: "Invitation cancelled.",
      };
      toast.success(msg[args.type]);
      setActionUser(null);
      setActionType(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [actionUser, setActionUser] = useState<Profile | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState<string>("all");
  const [fCategory, setFCategory] = useState<string>("all");

  const users = (usersQ.data?.users ?? []) as Profile[];

  const rows = useMemo(
    () =>
      users.filter((u) => {
        if (!showDeleted && u.status === "deleted") return false;
        if (fStatus !== "all" && u.status !== fStatus) return false;
        if (fCategory !== "all") {
          if (fCategory === "admin" ? u.account_role !== "admin" : u.user_category !== fCategory)
            return false;
        }
        if (q && !`${u.full_name} ${u.email}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [users, showDeleted, fStatus, fCategory, q],
  );

  if (!user) return null;

  const actionCopy: Record<Exclude<ActionType, null>, { title: string; desc: string }> = {
    delete: {
      title: "Delete user?",
      desc: "This permanently removes the user account and revokes access.",
    },
    disable: {
      title: "Disable user?",
      desc: "The user will lose access to the app until reactivated.",
    },
    reactivate: {
      title: "Reactivate user?",
      desc: "The user will regain access to the app immediately.",
    },
    resend: { title: "Resend invitation?", desc: "A new invitation email will be sent." },
    cancel_invite: { title: "Cancel invitation?", desc: "The pending invitation will be revoked." },
  };

  return (
    <PageContainer>
      <PageHeader
        title="Users"
        description="Control who can access the platform. One admin account — everyone else is faculty or student."
        actions={
          <Button asChild>
            <Link to="/settings/users/new">
              <UserPlus className="size-4" />
              Create User
            </Link>
          </Button>
        }
      />

      <Card className="p-4 mb-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or email…"
              className="pl-8"
            />
          </div>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={fCategory} onValueChange={setFCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
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
          <Label htmlFor="show-deleted" className="text-xs text-muted-foreground">
            Show deleted
          </Label>
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
            {usersQ.isLoading && Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-18 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-7 w-7 ml-auto" /></TableCell>
              </TableRow>
            ))}
            {rows.map((u) => {
              const isSelf = user.id === u.id;
              const isAdmin = u.account_role === "admin";
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.full_name || <span className="text-muted-foreground">—</span>}{" "}
                    {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isAdmin ? "default" : "outline"}>
                      {ACCOUNT_LABEL[u.account_role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.user_category ? (
                      <Badge variant="secondary">{CATEGORY_LABEL[u.user_category]}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_STYLES[u.status]}>{u.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {fmtDate(u.invited_at)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {fmtDate(u.accepted_at)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {fmtDate(u.last_sign_in_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isAdmin ? (
                          <DropdownMenuItem disabled>Admin account is protected</DropdownMenuItem>
                        ) : u.status === "invited" ? (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setActionUser(u);
                                setActionType("resend");
                              }}
                            >
                              Resend invite
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setActionUser(u);
                                setActionType("cancel_invite");
                              }}
                            >
                              Cancel invite
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditUser(u)}>
                              Edit user
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setActionUser(u);
                                setActionType("delete");
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </>
                        ) : u.status === "active" ? (
                          <>
                            <DropdownMenuItem onClick={() => setEditUser(u)}>
                              Edit user
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setActionUser(u);
                                setActionType("disable");
                              }}
                            >
                              Disable
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setActionUser(u);
                                setActionType("delete");
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </>
                        ) : u.status === "disabled" ? (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setActionUser(u);
                                setActionType("reactivate");
                              }}
                            >
                              Reactivate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setActionUser(u);
                                setActionType("delete");
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
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
        {usersQ.isError && (
          <div className="p-8 text-center text-sm text-destructive">
            Failed to load users: {(usersQ.error as Error).message}
          </div>
        )}
        {!usersQ.isLoading && rows.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No users match your filters.
          </div>
        )}
      </Card>

      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        {editUser && (
          <EditUserDialog
            user={editUser}
            onSubmit={(p) => editM.mutate({ id: editUser.id, payload: p })}
            onCancel={() => setEditUser(null)}
          />
        )}
      </Dialog>

      <AlertDialog
        open={!!actionType}
        onOpenChange={(o) => {
          if (!o) {
            setActionUser(null);
            setActionType(null);
          }
        }}
      >
        <AlertDialogContent>
          {actionType && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{actionCopy[actionType].title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {actionCopy[actionType].desc}
                  {actionUser && (
                    <span className="block mt-2 font-mono text-xs">{actionUser.email}</span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={actionM.isPending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={actionM.isPending}
                  onClick={() =>
                    actionUser &&
                    actionType &&
                    actionM.mutate({ type: actionType, id: actionUser.id })
                  }
                >
                  {actionM.isPending ? "Working…" : "Confirm"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
