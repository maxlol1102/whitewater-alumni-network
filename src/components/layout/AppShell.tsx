import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { CommandPalette, useCommandPalette } from "./CommandPalette";
import { UserAvatarMenu } from "./UserAvatarMenu";
import { useAuth, canAccess, isActive } from "@/lib/auth";

export function AppShell() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { open, setOpen } = useCommandPalette();

  useEffect(() => {
    if (loading) return;
    if (!user || !isActive(user)) {
      navigate({ to: "/login" });
      return;
    }
    if (!canAccess(user, path)) {
      navigate({ to: "/dashboard" });
    }
  }, [user, loading, path, navigate]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onSearchClick={() => setOpen(true)} />
      <main className="ml-[280px] min-h-screen px-10 pb-12">
        <Outlet />
      </main>
      <CommandPalette open={open} onOpenChange={setOpen} />
      <div className="fixed top-5 right-6 z-40">
        <UserAvatarMenu />
      </div>
    </div>
  );
}
