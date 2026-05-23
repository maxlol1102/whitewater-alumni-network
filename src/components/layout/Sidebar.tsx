import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Users, Handshake, Mail, ClipboardList, Settings, ScrollText, LogOut, Sun, Moon, GraduationCap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Role } from "@/mocks";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; roles: Role[]; section?: string };
const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "admin", "faculty"], section: "Overview" },
  { to: "/alumni", label: "Alumni", icon: Users, roles: ["super_admin", "admin", "faculty"], section: "Engage" },
  { to: "/mentorship", label: "Mentorship", icon: Handshake, roles: ["super_admin", "admin", "faculty"], section: "Engage" },
  { to: "/campaigns", label: "Campaigns", icon: Mail, roles: ["super_admin", "admin"], section: "Engage" },
  { to: "/surveys", label: "Surveys", icon: ClipboardList, roles: ["super_admin", "admin"], section: "Engage" },
  { to: "/settings/users", label: "Users", icon: Settings, roles: ["super_admin"], section: "Admin" },
  { to: "/settings/audit-log", label: "Audit log", icon: ScrollText, roles: ["super_admin"], section: "Admin" },
];

export function Sidebar() {
  const { user, signOut, switchRole } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();
  if (!user) return null;
  const items = NAV.filter((n) => n.roles.includes(user.role));
  const sections = Array.from(new Set(items.map((i) => i.section!)));

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col fixed inset-y-0 left-0 z-30 border-r border-sidebar-border">
      <div className="px-6 pt-7 pb-6">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center">
            <GraduationCap className="size-5" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-[15px]">UWW CS</div>
            <div className="text-xs text-muted-foreground">Alumni Connect</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {sections.map((section) => (
          <div key={section} className="mb-5">
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{section}</div>
            <div className="space-y-0.5">
              {items.filter((i) => i.section === section).map((item) => {
                const active = path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] transition-all",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon className="size-[17px]" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-4 pb-5 pt-4 border-t border-sidebar-border space-y-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-1.5 px-1">View as</div>
          <Select value={user.role} onValueChange={(v) => switchRole(v as Role)}>
            <SelectTrigger className="h-9 text-xs rounded-lg bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-full bg-accent text-accent-foreground grid place-items-center text-xs font-semibold shrink-0">
              {user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="text-xs min-w-0">
              <div className="font-medium truncate">{user.full_name}</div>
              <div className="text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>
          <div className="flex gap-0.5 shrink-0">
            <Button size="icon" variant="ghost" className="size-8" onClick={toggle} aria-label="Toggle theme">
              {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </Button>
            <Button size="icon" variant="ghost" className="size-8" onClick={() => { signOut(); navigate({ to: "/login" }); }} aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
