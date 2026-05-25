import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageSection } from "@/components/layout/Page";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createSurvey, updateSurvey, type SurveyRow } from "@/lib/surveys.functions";
import { listCampaigns } from "@/lib/campaigns.functions";

const schema = z.object({
  title: z.string().min(1, "Required"),
  form_url: z.string().url("Must be a valid URL"),
  tally_form_id: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  campaign_id: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function SurveyForm({ mode, initial }: { mode: "create" | "edit"; initial?: SurveyRow }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const listCampaignsFn = useServerFn(listCampaigns);
  const { data: campaignsData } = useQuery({
    queryKey: ["campaigns", "for-survey-picker"],
    queryFn: () => listCampaignsFn(),
  });
  const campaigns = campaignsData?.campaigns ?? [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? "",
      form_url: initial?.form_url ?? "",
      tally_form_id: initial?.tally_form_id ?? "",
      description: initial?.description ?? "",
      campaign_id: initial?.campaign_id ?? "none",
    },
  });

  const createFn = useServerFn(createSurvey);
  const updateFn = useServerFn(updateSurvey);

  const mutation = useMutation({
    mutationFn: async (values: FormData) => {
      const payload = {
        title: values.title,
        form_url: values.form_url,
        tally_form_id: values.tally_form_id || null,
        description: values.description ?? "",
        campaign_id:
          values.campaign_id && values.campaign_id !== "none" ? values.campaign_id : null,
      };
      if (mode === "edit" && initial) {
        return updateFn({ data: { id: initial.id, ...payload } });
      }
      return createFn({ data: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      toast.success(mode === "create" ? "Survey created" : "Survey updated");
      navigate({ to: "/surveys" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PageSection>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <Card>
          <CardHeader className="border-b border-border/70">
            <CardTitle>{mode === "create" ? "Survey details" : "Survey details"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-1.5">
              <Label>
                Title <span className="text-destructive">*</span>
              </Label>
              <Input {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>
                Form URL <span className="text-destructive">*</span>
              </Label>
              <Input placeholder="https://tally.so/r/... or https://forms.gle/..." {...register("form_url")} />
              {errors.form_url && (
                <p className="text-xs text-destructive">{errors.form_url.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Tally form ID</Label>
              <Input placeholder="e.g. wkAlB0" {...register("tally_form_id")} />
              <p className="text-xs text-muted-foreground">
                Optional. Find this in your Tally form URL: tally.so/r/<strong>wkAlB0</strong>. Used to automatically receive responses via webhook.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={4} {...register("description")} />
            </div>
            <div className="space-y-1.5">
              <Label>Linked campaign</Label>
              <Controller
                control={control}
                name="campaign_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {campaigns.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2 border-t border-border/70 pt-6">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/surveys" })}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {mode === "create" ? "Create survey" : "Save changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </PageSection>
  );
}
