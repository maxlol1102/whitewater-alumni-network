import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Mail, Newspaper, CalendarDays, ClipboardList, Plus, LayoutGrid, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EMAIL_TEMPLATES, type EmailTemplate } from "@/lib/email-templates";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ElementType> = {
  "mentorship-invite": Mail,
  "newsletter": Newspaper,
  "event-invite": CalendarDays,
  "survey-request": ClipboardList,
};

// ---------------------------------------------------------------------------
// Card view
// ---------------------------------------------------------------------------

function TemplateCard({ template, onClick }: { template: EmailTemplate; onClick: () => void }) {
  const Icon = ICONS[template.id] ?? Mail;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-5 text-left",
        "transition-all duration-150",
        "hover:border-primary/50 hover:shadow-md hover:shadow-primary/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary group-hover:bg-primary/12 transition-colors">
          <Icon className="size-5" />
        </div>
        <Badge variant="outline" className="shrink-0 capitalize text-xs">
          {template.campaignType}
        </Badge>
      </div>
      <div>
        <div className="font-semibold text-sm text-foreground">{template.name}</div>
        <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{template.description}</div>
      </div>
      <div className="mt-auto pt-1 text-xs text-muted-foreground/70 truncate">
        {template.subject}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// List view
// ---------------------------------------------------------------------------

function TemplateRow({ template, onClick }: { template: EmailTemplate; onClick: () => void }) {
  const Icon = ICONS[template.id] ?? Mail;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 text-left",
        "transition-all duration-150",
        "hover:border-primary/50 hover:bg-muted/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary group-hover:bg-primary/12 transition-colors">
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground">{template.name}</span>
          <Badge variant="outline" className="capitalize text-xs">{template.campaignType}</Badge>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground truncate">{template.description}</div>
      </div>
      <div className="shrink-0 text-xs text-muted-foreground/60 hidden sm:block max-w-[260px] truncate">
        {template.subject}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

type View = "grid" | "list";

export function TemplatePicker() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("grid");

  const go = (id: string) => navigate({ to: "/campaigns/new", search: { template: id } });

  return (
    <div>
      {/* Header row */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Choose a starting point</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Select a template to pre-fill the form, or start blank.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
              view === "grid"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
              view === "list"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-label="List view"
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {/* Templates */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {EMAIL_TEMPLATES.map((t) => (
            <TemplateCard key={t.id} template={t} onClick={() => go(t.id)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {EMAIL_TEMPLATES.map((t) => (
            <TemplateRow key={t.id} template={t} onClick={() => go(t.id)} />
          ))}
        </div>
      )}

      {/* Start blank */}
      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <Button
          type="button"
          variant="outline"
          onClick={() => go("blank")}
        >
          <Plus className="size-4" />
          Start blank
        </Button>
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
