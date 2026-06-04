import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LogOut, UserRound, Settings, LogIn } from "lucide-react";
import { useAuth, canEdit } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { updateMyProfile } from "@/lib/users.functions";
import { toast } from "sonner";

export function UserAvatarMenu() {
  const { user, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name ?? "");

  const updateFn = useServerFn(updateMyProfile);

  const editMutation = useMutation({
    mutationFn: () => updateFn({ data: { full_name: fullName.trim() } }),
    onSuccess: async () => {
      await refreshProfile();
      toast.success("Profile updated.");
      setEditOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handlePasswordReset() {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent.");
  }

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login" });
  }

  function openEdit() {
    setFullName(user?.full_name ?? "");
    setEditOpen(true);
  }

  const initials = user?.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";

  const isDirty = fullName.trim() !== (user?.full_name ?? "");

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center text-[11px] font-semibold hover:bg-primary/20 transition-colors ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="User menu"
          >
            {initials}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {user ? (
            <>
              <DropdownMenuLabel className="font-normal pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium leading-none truncate">{user.full_name}</span>
                  <Badge variant={user.account_role === "admin" ? "default" : "outline"} className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                    {user.account_role === "admin" ? "Admin" : user.user_category ?? "User"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground truncate font-mono">{user.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={openEdit}>
                <UserRound className="size-4" />
                Edit Profile
              </DropdownMenuItem>
              {canEdit(user) && (
                <DropdownMenuItem onClick={() => navigate({ to: "/settings/users" })}>
                  <Settings className="size-4" />
                  Account Settings
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Log Out
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={() => navigate({ to: "/login" })}>
              <LogIn className="size-4" />
              Log In
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={(o) => { if (!o) setEditOpen(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Full name</Label>
              <Input
                id="profile-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled />
              <p className="text-xs text-muted-foreground">Contact an admin to change your email.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePasswordReset}
                className="w-full"
              >
                Send password reset email
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => editMutation.mutate()}
              disabled={!isDirty || fullName.trim().length < 2 || editMutation.isPending}
              loading={editMutation.isPending}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
