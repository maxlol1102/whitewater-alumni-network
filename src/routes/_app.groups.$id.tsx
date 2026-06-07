import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash2, UserMinus, Users2 } from "lucide-react";
import { Breadcrumbs, PageContainer, PageHeader, EmptyState } from "@/components/layout/Page";
import {
  getGroup,
  updateGroup,
  deleteGroup,
  removeAlumniFromGroup,
  type GroupMember,
} from "@/lib/groups.functions";
import { useAuth, canEdit } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/groups/$id")({ component: GroupDetail });

const editSchema = z.object({
  name: z.string().min(1, "Required").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
});
type EditFormData = z.infer<typeof editSchema>;

function GroupDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = canEdit(user);

  const getFn = useServerFn(getGroup);
  const updateFn = useServerFn(updateGroup);
  const deleteFn = useServerFn(deleteGroup);
  const removeFn = useServerFn(removeAlumniFromGroup);

  const { data, isLoading } = useQuery({
    queryKey: ["groups", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const group = data?.group ?? null;
  const members = data?.members ?? [];

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<GroupMember | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    values: { name: group?.name ?? "", description: group?.description ?? "" },
  });

  const updateMut = useMutation({
    mutationFn: (values: EditFormData) =>
      updateFn({ data: { id, name: values.name, description: values.description || null } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups", id] });
      toast.success("Group updated");
      setEditOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group deleted");
      navigate({ to: "/groups" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMut = useMutation({
    mutationFn: (alumniId: string) =>
      removeFn({ data: { groupId: id, alumniId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", id] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Removed from group");
      setRemoveTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isLoading && !group) {
    return (
      <PageContainer>
        <PageHeader title="Group not found" className="mb-0" />
        <Breadcrumbs items={[{ label: "Groups", to: "/groups" }, { label: "Not found" }]} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={isLoading ? "Loading…" : (group?.name ?? "")}
        eyebrow="Group"
        className="mb-0"
        actions={
          isAdmin && group ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/5 hover:text-destructive border-destructive/30"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>
          ) : undefined
        }
      />
      <Breadcrumbs items={[{ label: "Groups", to: "/groups" }, { label: group?.name ?? "…" }]} />

      {/* Stats strip */}
      <div className="mb-6 flex items-center gap-6 text-sm text-muted-foreground">
        {isLoading ? (
          <Skeleton className="h-4 w-40" />
        ) : (
          <>
            <span>
              <span className="font-semibold text-foreground">{group?.member_count ?? 0}</span>{" "}
              {group?.member_count === 1 ? "member" : "members"}
            </span>
            {group?.description && (
              <>
                <span className="text-border">·</span>
                <span className="max-w-xl truncate">{group.description}</span>
              </>
            )}
            <span className="text-border">·</span>
            <span>Created {new Date(group?.created_at ?? "").toLocaleDateString()}</span>
          </>
        )}
      </div>

      {/* Members table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-9">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="w-24">Grad year</TableHead>
              <TableHead className={`w-20${!isAdmin ? " pr-9" : ""}`}>Mentor</TableHead>
              {isAdmin && <TableHead className="w-12 pr-6" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell className={!isAdmin ? "pr-6" : ""}><Skeleton className="h-4 w-8" /></TableCell>
                  {isAdmin && <TableCell className="pr-6" />}
                </TableRow>
              ))}

            {!isLoading && members.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} className="py-0">
                  <EmptyState
                    icon={Users2}
                    title="No members yet"
                    description="Go to the Alumni page, select alumni, and use the bulk action to add them to this group."
                    action={
                      <Button asChild variant="outline" size="sm">
                        <Link to="/alumni">Go to Alumni</Link>
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium pl-6">{m.full_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.email}</TableCell>
                  <TableCell className="text-sm">
                    {m.job_title && m.company
                      ? `${m.job_title} · ${m.company}`
                      : (m.company ?? m.job_title ?? <em className="text-muted-foreground/50">—</em>)}
                  </TableCell>
                  <TableCell className="text-sm">{m.graduation_year ?? "—"}</TableCell>
                  <TableCell className={!isAdmin ? "pr-6" : ""}>
                    {m.mentorship_interest && (
                      <Badge variant="outline" className="text-[10px]">Mentor</Badge>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="pr-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setRemoveTarget(m)}
                      >
                        <UserMinus className="size-3.5" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit group</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => updateMut.mutate(v))}>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={3} {...register("description")} />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" loading={updateMut.isPending}>Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete group dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{group?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              The group will be permanently deleted. Alumni in this group are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMut.mutate()}
            >
              Delete group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove member dialog */}
      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeTarget?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be removed from this group. Their alumni profile is not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => removeTarget && removeMut.mutate(removeTarget.id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
