import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_CAMPAIGNS, type Survey } from "@/mocks";
import { toast } from "sonner";
import { Controller } from "react-hook-form";

const schema = z.object({
  title: z.string().min(1, "Required"),
  form_url: z.string().url("Must be a valid URL"),
  description: z.string().optional().or(z.literal("")),
  campaign_id: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function SurveyForm({ mode, initial }: { mode: "create" | "edit"; initial?: Survey }) {
  const navigate = useNavigate();
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: initial?.title ?? "", form_url: initial?.form_url ?? "", description: initial?.description ?? "", campaign_id: initial?.campaign_id ?? "none" },
  });

  function onSubmit() {
    toast.success(mode === "create" ? "Survey created" : "Survey updated");
    navigate({ to: "/surveys" });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-24">
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
                {MOCK_CAMPAIGNS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </div>
      </Card>
      <div className="fixed bottom-0 left-60 right-0 bg-background/95 backdrop-blur border-t p-4 flex justify-end gap-2 z-20">
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/surveys" })}>Cancel</Button>
        <Button type="submit">{mode === "create" ? "Create survey" : "Save changes"}</Button>
      </div>
    </form>
  );
}
