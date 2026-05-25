import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Handshake,
  Mail,
  ClipboardList,
  Settings,
  ScrollText,
  BookOpen,
  LogOut,
  Sun,
  Moon,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AccountRole } from "@/mocks";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: AccountRole[];
  section: string;
};
const NAV: NavItem[] = [
  // ── Overview ──────────────────────────────────────────────────────────────
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "user"],
    section: "Overview",
  },
  // ── Alumni ────────────────────────────────────────────────────────────────
  {
    to: "/alumni",
    label: "Alumni",
    icon: Users,
    roles: ["admin", "user"],
    section: "Alumni",
  },
  {
    to: "/mentorship",
    label: "Mentorship",
    icon: Handshake,
    roles: ["admin", "user"],
    section: "Alumni",
  },
  // ── Outreach ──────────────────────────────────────────────────────────────
  {
    to: "/campaigns",
    label: "Campaigns",
    icon: Mail,
    roles: ["admin"],
    section: "Outreach",
  },
  {
    to: "/surveys",
    label: "Surveys",
    icon: ClipboardList,
    roles: ["admin"],
    section: "Outreach",
  },
  // ── Settings ──────────────────────────────────────────────────────────────
  {
    to: "/settings/users",
    label: "Users",
    icon: Settings,
    roles: ["admin"],
    section: "Settings",
  },
  {
    to: "/settings/audit-log",
    label: "Audit log",
    icon: ScrollText,
    roles: ["admin"],
    section: "Settings",
  },
  {
    to: "/settings/help-content",
    label: "Help content",
    icon: BookOpen,
    roles: ["admin"],
    section: "Settings",
  },
];

export function Sidebar({ onSearchClick }: { onSearchClick?: () => void }) {
  const { user, signOut } = useAuth();

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
          <Link to="/dashboard" className="group flex items-center">
            <img
              src="/uw-whitewater-logo.png"
              alt="University of Wisconsin Whitewater"
              className="h-auto w-[188px] transition-opacity group-hover:opacity-80"
            />
          </Link>
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={toggle}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
          </Button>
        </div>
      </div>

      {/* Search trigger */}
      <div className="px-5 pb-4">
        <button
          type="button"
          onClick={onSearchClick}
          className="relative w-full group"
          aria-label="Open command palette"
        >
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <div className="h-8 w-full rounded-md bg-surface-200/70 border border-transparent pl-8 pr-12 text-[12.5px] text-muted-foreground flex items-center select-none cursor-pointer group-hover:bg-sidebar-accent/60 group-hover:border-sidebar-border transition-colors">
            Search
          </div>
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted-foreground bg-background border border-border rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto pb-4">
        {sections.map((section) => {
          const groupItems = numbered.filter((i) => i.section === section);
          return (
            <div key={section} className="mb-5">
              <div className="flex items-center justify-between px-3 pb-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {section}
                </span>
              </div>
              <div className="space-y-0.5">
                {groupItems.map((item) => {
                  const active =
                    path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "relative flex items-center gap-2.5 pl-4 pr-3 py-2 rounded-md text-[13px] transition-all duration-150",
                        active
                          ? "bg-sidebar-accent text-foreground font-medium"
                          : "text-foreground/70 hover:bg-sidebar-accent/60 hover:text-foreground hover:translate-x-0.5",
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-primary" />
                      )}
                      <span
                        className={cn(
                          "font-mono text-[10.5px] w-5",
                          active ? "text-primary" : "text-muted-foreground/70",
                        )}
                      >
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
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-7 rounded-full bg-primary/10 text-primary grid place-items-center text-[10.5px] font-semibold shrink-0">
              {user.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="text-[11.5px] min-w-0 leading-tight">
              <div className="font-medium truncate">{user.full_name}</div>
              <div className="text-muted-foreground truncate font-mono text-[10px]">
                {user.account_role}
                {user.user_category ? ` · ${user.user_category}` : ""}
              </div>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="size-7 shrink-0"
            onClick={() => {
              signOut();
              navigate({ to: "/login" });
            }}
            aria-label="Sign out"
          >
            <LogOut className="size-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
