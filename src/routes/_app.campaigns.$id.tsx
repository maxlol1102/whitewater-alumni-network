import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Send, Pencil, Trash2 } from "lucide-react";
import { Breadcrumbs, PageContainer, PageHeader } from "@/components/layout/Page";
import { useAuth, canEdit } from "@/lib/auth";
import { toast } from "sonner";
import {
  deleteCampaign,
  getCampaign,
  sendCampaign,
  type CampaignRow,
} from "@/lib/campaigns.functions";

export const Route = createFileRoute("/_app/campaigns/$id")({ component: CampaignDetail });

const STATUS_STYLES: Record<CampaignRow["status"], string> = {
  draft: "bg-muted text-muted-foreground border-transparent",
  scheduled: "bg-warning/15 text-warning-foreground border-warning/30",
  sending: "bg-blue-100 text-blue-800 border-blue-200",
  sent: "bg-emerald-100 text-emerald-800 border-emerald-200",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
};

function CampaignDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canMutate = canEdit(user);
  useEffect(() => {
    if (user && user.account_role !== "admin") navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const getFn = useServerFn(getCampaign);
  const { data, isLoading } = useQuery({
    queryKey: ["campaigns", id],
    queryFn: () => getFn({ data: { id } }),
    enabled: user?.account_role === "admin",
  });
  const campaign = data?.campaign;

  const sendFn = useServerFn(sendCampaign);
  const delFn = useServerFn(deleteCampaign);
  const sendM = useMutation({
    mutationFn: () => sendFn({ data: { id } }),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success(`Sent to ${r.campaign.recipient_count} recipients`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const delM = useMutation({
    mutationFn: () => delFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Draft campaign deleted");
      navigate({ to: "/campaigns" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading)
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </PageContainer>
    );
  if (!campaign)
    return (
      <PageContainer>
        <p>Not found.</p>
      </PageContainer>
    );

  return (
    <PageContainer>
      <PageHeader title={campaign.name} description={campaign.subject} className="mb-0" />
      <Breadcrumbs items={[{ label: "Campaigns", to: "/campaigns" }, { label: campaign.name }]} />

      <Card className="p-6 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="font-medium">Campaign status</div>
              <Badge className={`${STATUS_STYLES[campaign.status]} capitalize`}>
                {campaign.status}
              </Badge>
            </div>
            <div className="flex gap-6 mt-4 text-sm">
              <div>
                <span className="text-muted-foreground">Recipients:</span>{" "}
                <span className="font-medium">{campaign.recipient_count}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Sent:</span>{" "}
                <span className="font-medium">
                  {campaign.sent_at ? new Date(campaign.sent_at).toLocaleString() : "—"}
                </span>
              </div>
            </div>
          </div>
          {canMutate && (
            <div className="flex gap-2">
              {campaign.status === "draft" && (
                <Button asChild variant="outline">
                  <Link to="/campaigns/$id/edit" params={{ id }}>
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                </Button>
              )}
              {campaign.status === "draft" && campaign.recipient_count > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button>
                      <Send className="size-4" />
                      Send
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Send to {campaign.recipient_count} recipients?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This cannot be undone. After sending, the campaign body and audience are
                        locked.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => sendM.mutate()}>
                        Send campaign
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {campaign.status === "draft" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete draft campaign?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove the draft.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => delM.mutate()}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="font-medium mb-3">Email preview</div>
        <div
          className="border rounded-md p-4 bg-surface-75 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: campaign.body }}
        />
      </Card>
    </PageContainer>
  );
}
