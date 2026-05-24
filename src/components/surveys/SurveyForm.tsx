import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createSurvey, updateSurvey, type SurveyRow } from "@/lib/surveys.functions";
import { listCampaigns } from "@/lib/campaigns.functions";

const schema = z.object({
  title: z.string().min(1, "Required"),
  form_url: z.string().url("Must be a valid URL"),
  description: z.string().optional().or(z.literal("")),
  campaign_id: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function SurveyForm({
  mode,
  initial,
  inDialog,
  onClose,
}: {
  mode: "create" | "edit";
  initial?: SurveyRow;
  inDialog?: boolean;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const listCampaignsFn = useServerFn(listCampaigns);
  const { data: campaignsData } = useQuery({
    queryKey: ["campaigns", "for-survey-picker"],
    queryFn: () => listCampaignsFn(),
  });
  const campaigns = campaignsData?.campaigns ?? [];

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? "",
      form_url: initial?.form_url ?? "",
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
        description: values.description ?? "",
        campaign_id: values.campaign_id && values.campaign_id !== "none" ? values.campaign_id : null,
      };
      if (mode === "edit" && initial) {
        return updateFn({ data: { id: initial.id, ...payload } });
      }
      return createFn({ data: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      toast.success(mode === "create" ? "Survey created" : "Survey updated");
      if (onClose) onClose();
      else navigate({ to: "/surveys" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className={inDialog ? "space-y-4" : "space-y-4 max-w-2xl mx-auto"}>
      <Card className="p-5 space-y-4">
        <div className="space-y-1.5">
          <Label>Title <span className="text-destructive">*</span></Label>
          <Input {...register("title")} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Form URL <span className="text-destructive">*</span></Label>
          <Input placeholder="https://forms.gle/…" {...register("form_url")} />
          {errors.form_url && <p className="text-xs text-destructive">{errors.form_url.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea rows={3} {...register("description")} />
        </div>
        <div className="space-y-1.5">
          <Label>Linked campaign</Label>
          <Controller control={control} name="campaign_id" render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </div>
      </Card>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => (onClose ? onClose() : navigate({ to: "/surveys" }))}>Cancel</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : mode === "create" ? "Create survey" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
