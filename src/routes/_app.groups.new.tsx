import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumbs, PageContainer, PageHeader, PageSection } from "@/components/layout/Page";
import { createGroup } from "@/lib/groups.functions";
import { useAuth, canEdit } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/groups/new")({ component: NewGroup });

const schema = z.object({
  name: z.string().min(1, "Required").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

function NewGroup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user && !canEdit(user)) navigate({ to: "/groups" });
  }, [user, navigate]);

  const createFn = useServerFn(createGroup);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormData) =>
      createFn({
        data: { name: values.name, description: values.description || null },
      }),
    onSuccess: ({ group }) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group created");
      navigate({ to: "/groups/$id", params: { id: group.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PageContainer>
      <PageHeader title="New group" className="mb-0" />
      <Breadcrumbs items={[{ label: "Groups", to: "/groups" }, { label: "New" }]} />
      <PageSection>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
          <Card>
            <CardHeader className="border-b border-border/70">
              <CardTitle>Group details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              <div className="space-y-1.5">
                <Label>
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input placeholder="e.g. Career Panel Pool" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  placeholder="What is this group for? Who should be in it?"
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-xs text-destructive">{errors.description.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2 border-t border-border/70 pt-6">
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/groups" })}>
                Cancel
              </Button>
              <Button type="submit" loading={mutation.isPending}>
                Create group
              </Button>
            </CardFooter>
          </Card>
        </form>
      </PageSection>
    </PageContainer>
  );
}
