import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3" />}
          {it.to ? <Link to={it.to} className="hover:text-foreground">{it.label}</Link> : <span className="text-foreground">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({ title, description, actions, eyebrow, className }: { title: string; description?: string; actions?: ReactNode; eyebrow?: string; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4 mb-10 pb-6 border-b border-border", className)}>
      <div>
        {eyebrow && (
          <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground mb-2.5">{eyebrow}</div>
        )}
        <h1 className="text-[30px] font-semibold tracking-[-0.02em] leading-[1.1]">{title}</h1>
        {description && <p className="text-[14.5px] leading-[1.65] text-muted-foreground mt-2 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("max-w-[1400px] mx-auto", className)}>{children}</div>;
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: React.ComponentType<{ className?: string }>; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 border border-dashed rounded-lg bg-surface-75">
      <div className="size-12 rounded-full bg-accent text-accent-foreground grid place-items-center mb-4">
        <Icon className="size-5" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
