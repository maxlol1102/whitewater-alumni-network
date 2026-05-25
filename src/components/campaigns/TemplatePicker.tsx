import { useNavigate } from "@tanstack/react-router";
import { Mail, Newspaper, CalendarDays, ClipboardList, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EMAIL_TEMPLATES, type EmailTemplate } from "@/lib/email-templates";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ElementType> = {
  "mentorship-invite": Mail,
  "newsletter": Newspaper,
  "event-invite": CalendarDays,
  "survey-request": ClipboardList,
};

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

function BlankCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-transparent p-5 text-center",
        "transition-all duration-150",
        "hover:border-primary/40 hover:bg-muted/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground group-hover:border-primary/40 group-hover:text-primary transition-colors">
        <Plus className="size-5" />
      </div>
      <div>
        <div className="font-semibold text-sm text-foreground">Start blank</div>
        <div className="mt-0.5 text-xs text-muted-foreground">Write from scratch</div>
      </div>
    </button>
  );
}

export function TemplatePicker() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-foreground">Choose a starting point</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a template to pre-fill the campaign form, or start blank.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {EMAIL_TEMPLATES.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            onClick={() =>
              navigate({ to: "/campaigns/new", search: { template: t.id } })
            }
          />
        ))}
        <BlankCard
          onClick={() => navigate({ to: "/campaigns/new", search: { template: "blank" } })}
        />
      </div>
    </div>
  );
}
