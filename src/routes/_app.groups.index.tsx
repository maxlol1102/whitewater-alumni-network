import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Users2, Trash2, Plus } from "lucide-react";
import { PageContainer, PageHeader, EmptyState } from "@/components/layout/Page";
import { listGroups, deleteGroup, type GroupRow } from "@/lib/groups.functions";
import { useAuth, canEdit } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/groups/")({ component: GroupsIndex });

function GroupsIndex() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = canEdit(user);

  const listFn = useServerFn(listGroups);
  const deleteFn = useServerFn(deleteGroup);

  const { data, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: () => listFn(),
  });
  const groups = data?.groups ?? [];

  const [deleteTarget, setDeleteTarget] = useState<GroupRow | null>(null);

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group deleted");
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PageContainer>
      <PageHeader
        title="Groups"
        description="Organize alumni into named groups for targeted outreach. Add alumni from the alumni table, then use groups as a campaign audience filter."
        actions={
          isAdmin ? (
            <Button asChild>
              <Link to="/groups/new">
                <Plus className="size-4" />
                New group
              </Link>
            </Button>
          ) : undefined
        }
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-28 text-right">Members</TableHead>
              <TableHead className="w-36">Created</TableHead>
              {isAdmin && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  {isAdmin && <TableCell />}
                </TableRow>
              ))}

            {!isLoading && groups.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 5 : 4} className="py-0">
                  <EmptyState
                    icon={Users2}
                    title="No groups yet"
                    description={isAdmin ? "Create a group to start organizing alumni for targeted campaigns." : "No groups have been created yet."}
                    action={
                      isAdmin ? (
                        <Button asChild size="sm">
                          <Link to="/groups/new">
                            <Plus className="size-3.5" />
                            Create first group
                          </Link>
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              groups.map((g) => (
                <TableRow
                  key={g.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => navigate({ to: "/groups/$id", params: { id: g.id } })}
                >
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {g.description ?? <em className="text-muted-foreground/50">—</em>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{g.member_count}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(g.created_at).toLocaleDateString()}
                  </TableCell>
                  {isAdmin && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(g)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              The group will be permanently deleted. Alumni in this group are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
            >
              Delete group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
