import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumbs, PageContainer, PageHeader } from "@/components/layout/Page";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { useAuth, canEdit } from "@/lib/auth";
import { toast } from "sonner";
import { getCampaign } from "@/lib/campaigns.functions";

export const Route = createFileRoute("/_app/campaigns/$id_/edit")({ component: EditCampaign });

function EditCampaign() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const getFn = useServerFn(getCampaign);
  const { data, isLoading } = useQuery({
    queryKey: ["campaigns", id],
    queryFn: () => getFn({ data: { id } }),
    enabled: user?.account_role === "admin",
  });
  const c = data?.campaign;

  useEffect(() => {
    if (user && !canEdit(user)) navigate({ to: "/dashboard" });
    if (c && c.status !== "draft") {
      toast.error("Only draft campaigns can be edited");
      navigate({ to: "/campaigns/$id", params: { id } });
    }
  }, [user, navigate, c, id]);

  if (isLoading)
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </PageContainer>
    );
  if (!c)
    return (
      <PageContainer>
        <p>Not found.</p>
      </PageContainer>
    );

  return (
    <PageContainer>
      <PageHeader title={`Edit ${c.name}`} className="mb-0" />
      <Breadcrumbs
        items={[
          { label: "Campaigns", to: "/campaigns" },
          { label: c.name, to: "/campaigns/$id", params: { id } },
          { label: "Edit" },
        ]}
      />
      <CampaignForm mode="edit" initial={c} />
    </PageContainer>
  );
}
