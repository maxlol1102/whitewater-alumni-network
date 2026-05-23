import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AlumniForm } from "@/components/alumni/AlumniForm";
import { Breadcrumbs, PageContainer, PageHeader } from "@/components/layout/Page";
import { MOCK_ALUMNI } from "@/mocks";
import { useAuth, canEdit } from "@/lib/auth";

export const Route = createFileRoute("/_app/alumni/$id/edit")({ component: EditAlumni });

function EditAlumni() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user && !canEdit(user.role)) navigate({ to: "/dashboard" }); }, [user, navigate]);
  const alumni = MOCK_ALUMNI.find((a) => a.id === id);
  if (!alumni) return <PageContainer><p>Not found.</p></PageContainer>;
  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Alumni", to: "/alumni" }, { label: alumni.full_name, to: "/alumni" }, { label: "Edit" }]} />
      <PageHeader title={`Edit ${alumni.full_name}`} />
      <AlumniForm mode="edit" initial={alumni} />
    </PageContainer>
  );
}
