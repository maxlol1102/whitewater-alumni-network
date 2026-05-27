import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type BreadcrumbItem = { label: string; to?: string; params?: Record<string, string> };

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length < 2) return null;
  // Always navigate to the immediate parent (second-to-last item).
  // For 2-item lists (Detail/New pages) that's the section root.
  // For 3-item lists (Edit pages) that's the detail page.
  const parent = items[items.length - 2];
  if (!parent.to) return null;
  return (
    <div className="mb-6 mt-4">
      <Link
        to={parent.to}
        params={parent.params ?? {}}
        className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
        Back to {parent.label}
      </Link>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 -mx-10 px-10 pt-8 pb-6 mb-10 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/75",
        className,
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground mb-2.5">
              {eyebrow}
            </div>
          )}
          <h1 className="text-[30px] font-semibold tracking-[-0.02em] leading-[1.1]">{title}</h1>
          {description && (
            <p className="text-[14.5px] leading-[1.65] text-muted-foreground mt-2 max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("w-full", className)}>{children}</div>;
}

export function PageSection({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("mx-auto w-full max-w-5xl", className)}>{children}</section>;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
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
