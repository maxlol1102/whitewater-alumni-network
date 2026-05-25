import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer, PageHeader, EmptyState } from "@/components/layout/Page";
import { HelpBlock } from "@/components/ui/HelpBlock";
import { useAuth, isActive } from "@/lib/auth";
import { listCampaigns, type CampaignRow } from "@/lib/campaigns.functions";

export const Route = createFileRoute("/_app/campaigns/")({ component: CampaignsList });

const STATUS_STYLES: Record<CampaignRow["status"], string> = {
  draft: "bg-muted text-muted-foreground border-transparent",
  scheduled: "bg-warning/15 text-warning-foreground border-warning/30",
  sending: "bg-blue-100 text-blue-800 border-blue-200",
  sent: "bg-emerald-100 text-emerald-800 border-emerald-200",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
};

function CampaignsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canMutate = isActive(user);

  const listFn = useServerFn(listCampaigns);
  const { data, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => listFn(),
    enabled: isActive(user),
  });
  const campaigns = data?.campaigns ?? [];

  return (
    <PageContainer>
      <PageHeader
        title="Campaigns"
        description="Reach the right alumni with the right message. Draft, target, send, and track every open and response."
        actions={
          canMutate ? (
            <Button asChild>
              <Link to="/campaigns/new">
                <Plus className="size-4" />
                Create campaign
              </Link>
            </Button>
          ) : undefined
        }
      />

      <HelpBlock
        helpKey="email_campaign"
        fallback={{ title: "Email campaigns", body: "Send personalized emails to a filtered segment of alumni. Each recipient receives the email with their first name and graduation year automatically filled in." }}
        className="mb-4"
      />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Sent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12">
                  <EmptyState
                    icon={Mail}
                    title="No campaigns yet"
                    description="Pick a template and your copy is half-written. Campaigns take minutes to set up."
                    action={
                      canMutate ? (
                        <Button asChild>
                          <Link to="/campaigns/new">
                            <Plus className="size-4" />
                            Create campaign
                          </Link>
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: "/campaigns/$id", params: { id: c.id } })}
                >
                  <TableCell className="font-medium">
                    <Link
                      to="/campaigns/$id"
                      params={{ id: c.id }}
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {c.type ?? "email"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${STATUS_STYLES[c.status]} capitalize`}>{c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {c.subject}
                  </TableCell>
                  <TableCell>{c.recipient_count}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.sent_at ? new Date(c.sent_at).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </PageContainer>
  );
}
