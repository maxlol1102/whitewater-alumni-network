import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { TAG_OPTIONS } from "@/mocks";
import { toast } from "sonner";
import { createCampaign, updateCampaign, previewRecipients, type CampaignRow } from "@/lib/campaigns.functions";
import { listAlumni } from "@/lib/alumni.functions";

const schema = z.object({
  name: z.string().min(1, "Required"),
  subject: z.string().min(1, "Required"),
  body: z.string().min(1, "Required"),
});
type FormData = z.infer<typeof schema>;

export function CampaignForm({ mode, initial, inDialog, onClose }: { mode: "create" | "edit"; initial?: CampaignRow; inDialog?: boolean; onClose?: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mentorOnly, setMentorOnly] = useState(initial?.filter_mentorship_only ?? false);
  const [tags, setTags] = useState<string[]>(initial?.filter_tags ?? []);
  const [years, setYears] = useState<number[]>(initial?.filter_grad_years ?? []);

  const listAlumniFn = useServerFn(listAlumni);
  const { data: alumniData } = useQuery({
    queryKey: ["alumni", "for-campaign-years"],
    queryFn: () => listAlumniFn({ data: {} }),
  });
  const allYears = useMemo(() => {
    const ys = (alumniData?.alumni ?? [])
      .map((a) => a.graduation_year)
      .filter((y): y is number => typeof y === "number");
    return Array.from(new Set(ys)).sort((a, b) => b - a);
  }, [alumniData]);

  const previewFn = useServerFn(previewRecipients);
  const [matched, setMatched] = useState(initial?.recipient_count ?? 0);
  useEffect(() => {
    let cancelled = false;
    previewFn({ data: { filter_mentorship_only: mentorOnly, filter_tags: tags, filter_grad_years: years } })
      .then((r) => { if (!cancelled) setMatched(r.count); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [mentorOnly, tags, years, previewFn]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: initial?.name ?? "", subject: initial?.subject ?? "", body: initial?.body ?? "" },
  });

  const createFn = useServerFn(createCampaign);
  const updateFn = useServerFn(updateCampaign);
  const mutation = useMutation({
    mutationFn: async (values: FormData) => {
      const payload = {
        ...values,
        filter_mentorship_only: mentorOnly,
        filter_tags: tags,
        filter_grad_years: years,
      };
      if (mode === "edit" && initial) {
        return updateFn({ data: { id: initial.id, ...payload } });
      }
      return createFn({ data: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success(mode === "create" ? "Draft campaign saved" : "Campaign updated");
      if (onClose) onClose();
      else navigate({ to: "/campaigns" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className={inDialog ? "space-y-4" : "grid lg:grid-cols-[1fr_360px] gap-4 pb-24"}>
      <div className="space-y-4">
        <Card className="p-5 space-y-4">
          <div className="font-medium">Email content</div>
          <div className="space-y-1.5">
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Subject <span className="text-destructive">*</span></Label>
            <Input {...register("subject")} />
            {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Email body (HTML allowed) <span className="text-destructive">*</span></Label>
            <Textarea rows={inDialog ? 8 : 14} className="font-mono text-xs" {...register("body")} />
            {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="p-5 space-y-4">
          <div className="font-medium">Audience filters</div>
          <div className="flex items-center justify-between">
            <Label>Mentorship only</Label>
            <Switch checked={mentorOnly} onCheckedChange={setMentorOnly} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Tags</Label>
            <div className="space-y-1">
              {TAG_OPTIONS.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={tags.includes(t)} onCheckedChange={(c) => setTags(c ? [...tags, t] : tags.filter((x) => x !== t))} />
                  {t}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Graduation years</Label>
            <div className="max-h-40 overflow-auto space-y-1 pr-1">
              {allYears.length === 0 && <p className="text-xs text-muted-foreground">No graduation years yet.</p>}
              {allYears.map((y) => (
                <label key={y} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={years.includes(y)} onCheckedChange={(c) => setYears(c ? [...years, y] : years.filter((x) => x !== y))} />
                  {y}
                </label>
              ))}
            </div>
          </div>
        </Card>
        <Card className="p-5 bg-accent">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Recipients matching filters</div>
          <div className="text-3xl font-semibold mt-1">{matched}</div>
          <p className="text-xs text-muted-foreground mt-1">Excludes archived alumni and rows with missing emails.</p>
        </Card>
      </div>

      {inDialog ? (
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onClose?.()}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save as draft"}</Button>
        </div>
      ) : (
        <div className="lg:col-span-2 fixed bottom-0 left-60 right-0 bg-background/95 backdrop-blur border-t p-4 flex justify-end gap-2 z-20">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/campaigns" })}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save as draft"}</Button>
        </div>
      )}
    </form>
  );
}
