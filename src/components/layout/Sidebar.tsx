import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Users, Handshake, Mail, ClipboardList, Settings, ScrollText, LogOut, Sun, Moon, GraduationCap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Role } from "@/mocks";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; roles: Role[] };
const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "admin", "faculty"] },
  { to: "/alumni", label: "Alumni", icon: Users, roles: ["super_admin", "admin", "faculty"] },
  { to: "/mentorship", label: "Mentorship", icon: Handshake, roles: ["super_admin", "admin", "faculty"] },
  { to: "/campaigns", label: "Campaigns", icon: Mail, roles: ["super_admin", "admin"] },
  { to: "/surveys", label: "Surveys", icon: ClipboardList, roles: ["super_admin", "admin"] },
  { to: "/settings/users", label: "Settings", icon: Settings, roles: ["super_admin"] },
  { to: "/settings/audit-log", label: "Audit Log", icon: ScrollText, roles: ["super_admin"] },
];

export function Sidebar() {
  const { user, signOut, switchRole } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();
  if (!user) return null;
  const items = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <aside className="w-60 bg-sidebar text-sidebar-foreground flex flex-col fixed inset-y-0 left-0 z-30">
      <div className="px-5 pt-6 pb-4 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="size-8 rounded-md bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center">
            <GraduationCap className="size-5" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-sm">UWW CS</div>
            <div className="text-xs opacity-80">Alumni</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/60"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-4 pt-3 border-t border-sidebar-border space-y-3">
        <div className="px-2">
          <div className="text-xs opacity-70 mb-1">Mock role switcher</div>
          <Select value={user.role} onValueChange={(v) => switchRole(v as Role)}>
            <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between px-2">
          <div className="text-xs">
            <div className="font-medium truncate max-w-[120px]">{user.full_name}</div>
            <div className="opacity-70 truncate max-w-[120px]">{user.email}</div>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="size-7 text-sidebar-foreground hover:bg-sidebar-accent" onClick={toggle} aria-label="Toggle theme">
              {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </Button>
            <Button size="icon" variant="ghost" className="size-7 text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => { signOut(); navigate({ to: "/login" }); }} aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
