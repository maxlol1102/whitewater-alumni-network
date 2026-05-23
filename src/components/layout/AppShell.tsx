import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { useAuth, canAccess } from "@/lib/auth";

export function AppShell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!canAccess(user.role, path)) {
      navigate({ to: "/dashboard" });
    }
  }, [user, path, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 min-h-screen px-10 py-10 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
