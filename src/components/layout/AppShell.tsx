import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { useAuth, canAccess, isActive } from "@/lib/auth";

export function AppShell() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

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
      <Sidebar />
      <main className="ml-[280px] min-h-screen px-10 py-12 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
