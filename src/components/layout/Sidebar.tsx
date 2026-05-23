import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Users, Handshake, Mail, ClipboardList, Settings, ScrollText, LogOut, Sun, Moon, GraduationCap, Search } from "lucide-react";
import { useAuth, IDENTITY_LABEL, type IdentityKey } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { AccountRole } from "@/mocks";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; roles: AccountRole[]; section: string };
const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "staff"], section: "Overview" },
  { to: "/alumni", label: "Alumni", icon: Users, roles: ["super_admin", "staff"], section: "Engage" },
  { to: "/mentorship", label: "Mentorship", icon: Handshake, roles: ["super_admin", "staff"], section: "Engage" },
  { to: "/campaigns", label: "Campaigns", icon: Mail, roles: ["super_admin"], section: "Engage" },
  { to: "/surveys", label: "Surveys", icon: ClipboardList, roles: ["super_admin"], section: "Engage" },
  { to: "/settings/users", label: "Users", icon: Settings, roles: ["super_admin"], section: "Admin" },
  { to: "/settings/audit-log", label: "Audit log", icon: ScrollText, roles: ["super_admin"], section: "Admin" },
];

const SWITCHER: IdentityKey[] = ["super_admin", "staff_faculty", "staff_student", "invited", "disabled"];

export function Sidebar() {
  const { user, identity, signOut, signInAs } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();
  if (!user) return null;
  const items = NAV.filter((n) => n.roles.includes(user.account_role));
  const sections = Array.from(new Set(items.map((i) => i.section)));

  let counter = 0;
  const numbered = items.map((i) => ({ ...i, num: String(++counter).padStart(2, "0") }));

  return (
    <aside className="w-[280px] bg-sidebar text-sidebar-foreground flex flex-col fixed inset-y-0 left-0 z-30 border-r border-sidebar-border">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="group flex items-center gap-2.5">
            <div className="relative size-8 rounded-md bg-foreground/[0.06] grid place-items-center transition-transform group-hover:scale-105">
              <GraduationCap className="size-[18px] text-foreground/80" />
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary ring-2 ring-sidebar" />
            </div>
            <div className="leading-tight">
              <div className="text-[13.5px] font-semibold">UWW CS Alumni</div>
              <div className="font-mono text-[10.5px] text-muted-foreground mt-0.5">connect · v1.0</div>
            </div>
          </Link>
          <Button size="icon" variant="ghost" className="size-7" onClick={toggle} aria-label="Toggle theme">
            {theme === "light" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
          </Button>
        </div>
        <p className="mt-3 text-[12px] leading-[1.55] text-muted-foreground">
          A quiet workspace for engaging Computer Science alumni.
        </p>
      </div>

      {/* Search */}
      <div className="px-5 pb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            placeholder="Search"
            className="h-8 w-full rounded-md bg-surface-200/70 border border-transparent pl-8 pr-12 text-[12.5px] placeholder:text-muted-foreground focus:outline-none focus:border-border focus:bg-background transition-colors"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted-foreground bg-background border border-border rounded px-1.5 py-0.5">⌘K</kbd>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto pb-4">
        {sections.map((section) => {
          const groupItems = numbered.filter((i) => i.section === section);
          return (
            <div key={section} className="mb-5">
              <div className="flex items-center justify-between px-3 pb-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{section}</span>
                <span className="font-mono text-[10px] text-muted-foreground/70">{String(groupItems.length).padStart(2, "0")}</span>
              </div>
              <div className="space-y-0.5">
                {groupItems.map((item) => {
                  const active = path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "relative flex items-center gap-2.5 pl-4 pr-3 py-2 rounded-md text-[13px] transition-all duration-150",
                        active
                          ? "bg-sidebar-accent text-foreground font-medium"
                          : "text-foreground/70 hover:bg-sidebar-accent/60 hover:text-foreground hover:translate-x-0.5"
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-primary" />
                      )}
                      <span className={cn("font-mono text-[10.5px] w-5", active ? "text-primary" : "text-muted-foreground/70")}>
                        {item.num}
                      </span>
                      <Icon className={cn("size-[15px]", active ? "opacity-100" : "opacity-70")} />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 pb-4 pt-3 border-t border-sidebar-border space-y-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5 px-1">View as</div>
          <Select value={identity ?? "super_admin"} onValueChange={(v) => { signInAs(v as IdentityKey); navigate({ to: "/dashboard" }); }}>
            <SelectTrigger className="h-8 text-xs rounded-md bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SWITCHER.map((k) => (
                <SelectItem key={k} value={k}>{IDENTITY_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-7 rounded-full bg-primary/10 text-primary grid place-items-center text-[10.5px] font-semibold shrink-0">
              {user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="text-[11.5px] min-w-0 leading-tight">
              <div className="font-medium truncate">{user.full_name}</div>
              <div className="text-muted-foreground truncate font-mono text-[10px]">
                {user.account_role}
                {user.department_role ? ` · ${user.department_role}` : ""}
              </div>
            </div>
          </div>
          <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={() => { signOut(); navigate({ to: "/login" }); }} aria-label="Sign out">
            <LogOut className="size-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
