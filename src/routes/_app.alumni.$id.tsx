import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Archive, ArrowLeft, Mail, Linkedin, MapPin, Briefcase } from "lucide-react";
import { Breadcrumbs, PageContainer } from "@/components/layout/Page";
import { MOCK_ALUMNI, MOCK_SURVEY_RESPONSES, MENTOR_CATEGORY_LABELS } from "@/mocks";
import { useAuth, canEdit } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/alumni/$id")({ component: AlumniProfile });

function AlumniProfile() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canMutate = canEdit(user);
  const [archived, setArchived] = useState(false);
  const alumni = MOCK_ALUMNI.find((a) => a.id === id);
  const responses = MOCK_SURVEY_RESPONSES.filter((r) => r.alumni_id === id);

  if (!alumni) {
    return (
      <PageContainer>
        <Breadcrumbs items={[{ label: "Alumni", to: "/alumni" }, { label: "Not found" }]} />
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Alumni not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate({ to: "/alumni" })}><ArrowLeft className="size-4" />Back to alumni</Button>
        </Card>
      </PageContainer>
    );
  }

  const initials = alumni.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("");

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Alumni", to: "/alumni" }, { label: alumni.full_name }]} />

      <Card className="p-6 mb-6">
        <div className="flex flex-wrap items-start gap-5 justify-between">
          <div className="flex items-start gap-4">
            <div className="size-16 rounded-full bg-primary text-primary-foreground grid place-items-center text-xl font-semibold">{initials}</div>
            <div>
              <h1 className="text-2xl font-semibold">{alumni.full_name}</h1>
              <p className="text-muted-foreground">{alumni.job_title} at {alumni.company}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {alumni.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                {alumni.mentorship_interest && <Badge className="bg-primary/10 text-primary border-primary/20">Mentor</Badge>}
                {(archived || alumni.archived) && <Badge variant="destructive">Archived</Badge>}
              </div>
            </div>
          </div>
          {canMutate && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate({ to: "/alumni/$id/edit", params: { id } })}><Pencil className="size-4" />Edit</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="outline"><Archive className="size-4" />Archive</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Archive {alumni.full_name}?</AlertDialogTitle>
                    <AlertDialogDescription>They will be hidden from active views. This is a soft delete and can be reversed.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { setArchived(true); toast.success(`Archived ${alumni.full_name}`); }}>Archive</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </Card>

      <Tabs defaultValue="career">
        <TabsList>
          <TabsTrigger value="career">Career</TabsTrigger>
          <TabsTrigger value="responses">Survey Responses</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="career">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="font-medium mb-3">Contact</div>
              <Detail icon={Mail} label="Email"><a href={`mailto:${alumni.email}`} className="text-primary hover:underline">{alumni.email}</a></Detail>
              {alumni.phone && <Detail label="Phone">{alumni.phone}</Detail>}
              {alumni.linkedin_url && <Detail icon={Linkedin} label="LinkedIn"><a href={alumni.linkedin_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">View profile</a></Detail>}
              <Detail icon={MapPin} label="Location">{alumni.location}</Detail>
            </Card>
            <Card className="p-5">
              <div className="font-medium mb-3">Career & academic</div>
              <Detail icon={Briefcase} label="Job">{alumni.job_title} at {alumni.company}</Detail>
              <Detail label="Industry">{alumni.industry}</Detail>
              <Detail label="Graduated">{alumni.graduation_year} — {alumni.degree_program}</Detail>
            </Card>
            <Card className="p-5 md:col-span-2">
              <div className="font-medium mb-3">Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {alumni.technical_skills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
              </div>
              {alumni.mentorship_interest && (
                <>
                  <div className="font-medium mt-5 mb-2">Mentorship categories</div>
                  <div className="flex flex-wrap gap-1.5">
                    {alumni.mentorship_categories.map((c) => <Badge key={c} className="bg-primary/10 text-primary border-primary/20">{MENTOR_CATEGORY_LABELS[c] ?? c}</Badge>)}
                  </div>
                </>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="responses">
          <Card className="p-5">
            {responses.length === 0 ? <p className="text-sm text-muted-foreground">No survey responses linked to this alumni.</p> : (
              <ul className="divide-y">
                {responses.map((r) => (
                  <li key={r.id} className="py-2 flex justify-between text-sm">
                    <Link to="/surveys/$id" params={{ id: r.survey_id }} className="text-primary hover:underline">Survey {r.survey_id}</Link>
                    <span className="text-muted-foreground">{new Date(r.submitted_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card className="p-5">
            <p className="text-sm whitespace-pre-wrap">{alumni.notes || <span className="text-muted-foreground">No notes recorded.</span>}</p>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function Detail({ label, children, icon: Icon }: { label: string; children: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-start gap-2 py-1.5 text-sm">
      {Icon && <Icon className="size-4 text-muted-foreground mt-0.5" />}
      <div className="w-24 text-muted-foreground">{label}</div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
