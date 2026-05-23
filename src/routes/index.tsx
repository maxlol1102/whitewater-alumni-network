import { createFileRoute, redirect } from "@tanstack/react-router";
import { getStoredUser, isActive } from "@/lib/auth";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window === "undefined") throw redirect({ to: "/login" });
    const u = getStoredUser();
    throw redirect({ to: isActive(u) ? "/dashboard" : "/login" });
  },
});
