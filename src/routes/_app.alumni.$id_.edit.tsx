import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlumniForm } from "@/components/alumni/AlumniForm";
import { Breadcrumbs, PageContainer, PageHeader } from "@/components/layout/Page";
import { Card } from "@/components/ui/card";
import { useAuth, canEdit } from "@/lib/auth";
import { getAlumni } from "@/lib/alumni.functions";

export const Route = createFileRoute("/_app/alumni/$id_/edit")({ component: EditAlumni });

function EditAlumni() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user && !canEdit(user)) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const fetchOne = useServerFn(getAlumni);
  const { data, isLoading } = useQuery({
    queryKey: ["alumni", id],
    queryFn: () => fetchOne({ data: { id } }),
  });

  if (isLoading) {
    return (
      <PageContainer>
        <Card className="p-8 text-center text-sm text-muted-foreground">Loading…</Card>
      </PageContainer>
    );
  }
  const alumni = data?.alumni;
  if (!alumni) {
    return (
      <PageContainer>
        <Card className="p-8 text-center text-sm text-muted-foreground">Not found.</Card>
      </PageContainer>
    );
  }
  return (
    <PageContainer>
      <PageHeader title={`Edit ${alumni.full_name}`} className="mb-0" />
      <Breadcrumbs
        items={[
          { label: "Alumni", to: "/alumni" },
          { label: alumni.full_name, to: "/alumni/$id", params: { id } },
          { label: "Edit" },
        ]}
      />
      <AlumniForm mode="edit" initial={alumni} />
    </PageContainer>
  );
}
