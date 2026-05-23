import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Mail } from "lucide-react";
import { Breadcrumbs, PageContainer, PageHeader, EmptyState } from "@/components/layout/Page";
import { MOCK_CAMPAIGNS, type Campaign } from "@/mocks";
import { useAuth, canEdit } from "@/lib/auth";

export const Route = createFileRoute("/_app/campaigns/")({ component: CampaignsList });

const STATUS_STYLES: Record<Campaign["status"], string> = {
  draft: "bg-muted text-muted-foreground border-transparent",
  scheduled: "bg-warning/15 text-warning-foreground border-warning/30",
  sending: "bg-blue-100 text-blue-800 border-blue-200",
  sent: "bg-emerald-100 text-emerald-800 border-emerald-200",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
};

function CampaignsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user && user.role === "faculty") navigate({ to: "/dashboard" }); }, [user, navigate]);
  const canMutate = canEdit(user?.role);

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Campaigns" }]} />
      <PageHeader title="Campaigns" description="Email campaigns sent to alumni segments." actions={canMutate && <Button onClick={() => navigate({ to: "/campaigns/new" })}><Plus className="size-4" />Create campaign</Button>} />

      {MOCK_CAMPAIGNS.length === 0 ? (
        <EmptyState icon={Mail} title="No campaigns yet" description="Create your first campaign to email a segment of alumni." action={canMutate ? <Button onClick={() => navigate({ to: "/campaigns/new" })}><Plus className="size-4" />Create campaign</Button> : undefined} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_CAMPAIGNS.map((c) => (
            <Link key={c.id} to="/campaigns/$id" params={{ id: c.id }} className="block">
              <Card className="p-5 hover:border-primary/50 transition-colors h-full">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium line-clamp-2">{c.name}</div>
                  <Badge className={`${STATUS_STYLES[c.status]} capitalize`}>{c.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{c.subject}</p>
                <div className="flex justify-between mt-5 text-sm">
                  <span>{c.recipient_count} recipients</span>
                  <span className="text-muted-foreground">{c.sent_at ? new Date(c.sent_at).toLocaleDateString() : "Draft"}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
