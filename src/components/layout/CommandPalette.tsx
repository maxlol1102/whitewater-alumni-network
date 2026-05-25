import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Handshake,
  Mail,
  ClipboardList,
  Settings,
  ScrollText,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAuth } from "@/lib/auth";
import type { AccountRole } from "@/mocks";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: AccountRole[];
  group: string;
};

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "user"], group: "Navigate" },
  { to: "/alumni", label: "Alumni", icon: Users, roles: ["admin", "user"], group: "Navigate" },
  { to: "/mentorship", label: "Mentorship", icon: Handshake, roles: ["admin", "user"], group: "Navigate" },
  { to: "/campaigns", label: "Campaigns", icon: Mail, roles: ["admin"], group: "Navigate" },
  { to: "/surveys", label: "Surveys", icon: ClipboardList, roles: ["admin"], group: "Navigate" },
  { to: "/settings/users", label: "Users", icon: Settings, roles: ["admin"], group: "Settings" },
  { to: "/settings/audit-log", label: "Audit Log", icon: ScrollText, roles: ["admin"], group: "Settings" },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  if (!user) return null;

  const items = NAV.filter((n) => n.roles.includes(user.account_role));
  const groups = Array.from(new Set(items.map((i) => i.group)));

  function go(to: string) {
    onOpenChange(false);
    navigate({ to } as Parameters<typeof navigate>[0]);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((group) => (
          <CommandGroup key={group} heading={group}>
            {items
              .filter((i) => i.group === group)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem key={item.to} onSelect={() => go(item.to)}>
                    <Icon className="size-4" />
                    {item.label}
                  </CommandItem>
                );
              })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return { open, setOpen };
}
