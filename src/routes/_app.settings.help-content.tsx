import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  listHelpContent,
  upsertHelpContent,
  deleteHelpContent,
  type HelpContentRow,
} from "@/lib/help-content.functions";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/settings/help-content")({
  validateSearch: z.object({ key: z.string().optional() }),
  component: HelpContentPage,
});

const formSchema = z.object({
  key: z.string().min(1, "Required").max(120).regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, underscores only"),
  title: z.string().max(200),
  body: z.string().min(1, "Required").max(10_000),
});
type FormData = z.infer<typeof formSchema>;

function HelpContentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { key: focusKey } = Route.useSearch();

  useEffect(() => {
    if (user && user.account_role !== "admin") navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const listFn = useServerFn(listHelpContent);
  const upsertFn = useServerFn(upsertHelpContent);
  const deleteFn = useServerFn(deleteHelpContent);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["help-content", "list"],
    queryFn: () => listFn(),
    enabled: !!user && user.account_role === "admin",
  });

  const [editing, setEditing] = useState<HelpContentRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<HelpContentRow | null>(null);

  // If navigated here with ?key=..., open that key for editing
  useEffect(() => {
    if (!focusKey || !data?.items) return;
    const found = data.items.find((r) => r.key === focusKey);
    if (found) {
      setEditing(found);
    } else {
      // key doesn't exist yet — open new dialog pre-filled with that key
      setEditing("new");
      reset({ key: focusKey, title: "", body: "" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, data?.items]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { key: "", title: "", body: "" },
  });

  function openEdit(row: HelpContentRow) {
    reset({ key: row.key, title: row.title, body: row.body });
    setEditing(row);
  }

  function openNew() {
    reset({ key: "", title: "", body: "" });
    setEditing("new");
  }

  function closeDialog() {
    setEditing(null);
    if (focusKey) navigate({ to: "/settings/help-content" });
  }

  const saveMutation = useMutation({
    mutationFn: (values: FormData) => upsertFn({ data: values }),
    onSuccess: () => {
      toast.success("Help content saved");
      qc.invalidateQueries({ queryKey: ["help-content"] });
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => deleteFn({ data: { key } }),
    onSuccess: () => {
      toast.success("Help content deleted");
      qc.invalidateQueries({ queryKey: ["help-content"] });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data?.items ?? [];

  return (
    <PageContainer>
      <PageHeader
        title="Help content"
        description="Manage the help and documentation blocks shown across the app. Changes take effect immediately everywhere the key is used."
        actions={
          <Button onClick={openNew}>
            <Plus className="size-4" />
            Add new
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4">
                <Skeleton className="h-4 w-32 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No help content yet.{" "}
            <button type="button" onClick={openNew} className="text-primary underline-offset-4 hover:underline">
              Add the first entry.
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((row) => (
              <div key={row.key} className="flex items-start gap-4 px-5 py-4">
                <code className="mt-0.5 shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground w-44 truncate">
                  {row.key}
                </code>
                <div className="flex-1 min-w-0">
                  {row.title && (
                    <p className="text-sm font-medium text-foreground truncate">{row.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{row.body}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleting(row)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edit / New dialog */}
      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Add help content" : "Edit help content"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Key <span className="text-destructive">*</span></Label>
              <Input
                {...register("key")}
                placeholder="e.g. email_campaign"
                disabled={editing !== "new" && editing !== null}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and underscores. Used by <code className="bg-muted px-1 rounded text-[11px]">{"<HelpBlock helpKey=\"...\" />"}</code>.
              </p>
              {errors.key && <p className="text-xs text-destructive">{errors.key.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input {...register("title")} placeholder="Short heading (optional)" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Body <span className="text-destructive">*</span></Label>
              <Textarea
                {...register("body")}
                rows={8}
                placeholder="Explanation shown to users. Use blank lines to separate paragraphs."
              />
              {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" loading={saveMutation.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete help content?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the <code className="bg-muted px-1 rounded text-xs">{deleting?.key}</code> block everywhere it is used in the app. Any page using this key will fall back to its default text or show nothing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && deleteMutation.mutate(deleting.key)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
