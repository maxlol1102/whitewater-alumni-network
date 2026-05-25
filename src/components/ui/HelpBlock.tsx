import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Info, Pencil } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getHelpContent } from "@/lib/help-content.functions";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type HelpBlockProps = {
  helpKey: string;
  /** Shown while loading or if no DB row exists yet */
  fallback?: { title?: string; body: string };
  className?: string;
};

/**
 * Renders a help/info block fetched from the help_content table by key.
 * Admins see an edit link that navigates to Settings → Help content.
 *
 * Usage:
 *   <HelpBlock helpKey="email_campaign" fallback={{ title: "Email campaigns", body: "..." }} />
 *
 * To add a new key: insert a row in the help_content table or visit
 * Settings → Help content and click "Add new".
 */
export function HelpBlock({ helpKey, fallback, className }: HelpBlockProps) {
  const { user } = useAuth();
  const isAdmin = user?.account_role === "admin";

  const getFn = useServerFn(getHelpContent);
  const { data, isLoading } = useQuery({
    queryKey: ["help-content", helpKey],
    queryFn: () => getFn({ data: { key: helpKey } }),
    staleTime: 5 * 60 * 1000, // 5 min — help text rarely changes
  });

  const content = data?.content;
  const title = content?.title || fallback?.title;
  const body = content?.body || fallback?.body;

  if (isLoading) {
    return (
      <div className={cn("rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2", className)}>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    );
  }

  if (!body) return null;

  return (
    <div className={cn("rounded-lg border border-border/60 bg-muted/30 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 space-y-1">
            {title && (
              <p className="text-sm font-medium text-foreground">{title}</p>
            )}
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {body}
            </p>
          </div>
        </div>
        {isAdmin && (
          <Link
            to="/settings/help-content"
            search={{ key: helpKey }}
            className="shrink-0 rounded p-1 text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground transition-colors"
            title="Edit help content"
          >
            <Pencil className="size-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
