import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  SlidersHorizontal,
  X,
  Upload,
  Download,
  Plus,
  Users,
  Users2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer, PageHeader, EmptyState } from "@/components/layout/Page";
import { INDUSTRY_OPTIONS, TAG_OPTIONS } from "@/mocks";
import { useAuth, canEdit } from "@/lib/auth";
import {
  listAlumni,
  patchAlumni,
  deleteAlumni,
  bulkDeleteAlumni,
  type AlumniRow,
} from "@/lib/alumni.functions";
import { listGroups, addAlumniToGroup } from "@/lib/groups.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/alumni/")({ component: AlumniList });

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

type DeleteTarget =
  | { type: "single"; id: string; name: string }
  | { type: "bulk"; ids: string[] };

// ─── Tags inline editor ───────────────────────────────────────────────────

function TagsCell({ row, canMutate }: { row: AlumniRow; canMutate: boolean }) {
  const queryClient = useQueryClient();
  const patchFn = useServerFn(patchAlumni);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(row.tags);

  useEffect(() => { setDraft(row.tags); }, [row.tags]);

  const mutation = useMutation({
    mutationFn: (tags: string[]) => patchFn({ data: { id: row.id, tags } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alumni"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  function handleOpenChange(o: boolean) {
    if (!o && canMutate) {
      const changed =
        draft.length !== row.tags.length || draft.some((t) => !row.tags.includes(t));
      if (changed) mutation.mutate(draft);
    }
    if (o) setDraft(row.tags);
    setOpen(o);
  }

  const badges = (
    <>
      {row.tags.slice(0, 2).map((t) => (
        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
      ))}
      {row.tags.length > 2 && (
        <Badge variant="outline" className="text-xs">+{row.tags.length - 2}</Badge>
      )}
      {canMutate && row.tags.length === 0 && (
        <span className="text-xs text-muted-foreground/60">Add tags</span>
      )}
    </>
  );

  if (!canMutate) {
    return <div className="flex gap-1 flex-wrap">{badges}</div>;
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="flex gap-1 flex-wrap items-center rounded px-1 -mx-1 py-0.5 hover:bg-muted/50 transition-colors min-w-[3rem] text-left"
        >
          {badges}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-52 p-3"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Tags
        </p>
        <div className="space-y-1.5">
          {TAG_OPTIONS.map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={draft.includes(t)}
                onCheckedChange={(c) =>
                  setDraft(c ? [...draft, t] : draft.filter((x) => x !== t))
                }
              />
              {t}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Main list ────────────────────────────────────────────────────────────

function AlumniList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canMutate = canEdit(user);
  const list = useServerFn(listAlumni);
  const patchFn = useServerFn(patchAlumni);
  const deleteFn = useServerFn(deleteAlumni);
  const bulkDeleteFn = useServerFn(bulkDeleteAlumni);
  const listGroupsFn = useServerFn(listGroups);
  const addToGroupFn = useServerFn(addAlumniToGroup);

  // ─ search + filters
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [years, setYears] = useState<number[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [mentorOnly, setMentorOnly] = useState(false);
  const [yearSearch, setYearSearch] = useState("");

  // ─ pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(25);

  // ─ selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ─ delete dialog
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // ─ add to group dialog
  const [addToGroupOpen, setAddToGroupOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => { setPage(1); }, [debouncedQ, years, industries, tags, mentorOnly, pageSize]);

  const queryParams = { q: debouncedQ, page, pageSize, years, industries, tags, mentorOnly };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["alumni", queryParams],
    queryFn: () => list({ data: queryParams }),
    placeholderData: (prev) => prev,
  });

  const rows = data?.alumni ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstOnPage = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastOnPage = Math.min(page * pageSize, total);

  const currentYear = new Date().getFullYear();
  const allYears = Array.from({ length: currentYear - 1990 + 1 }, (_, i) => currentYear - i);

  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someOnPageSelected = rows.some((r) => selected.has(r.id));

  // ─ mutations
  const mentorMutation = useMutation({
    mutationFn: ({ id, mentorship_interest }: { id: string; mentorship_interest: boolean }) =>
      patchFn({ data: { id, mentorship_interest } }),
    onMutate: async ({ id, mentorship_interest }) => {
      // Cancel any in-flight refetches so they don't overwrite the optimistic value.
      await queryClient.cancelQueries({ queryKey: ["alumni"] });
      // Immediately flip the switch in every cached alumni page.
      queryClient.setQueriesData<{ alumni: AlumniRow[]; total: number; page: number; pageSize: number }>(
        { queryKey: ["alumni"], exact: false },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            alumni: old.alumni.map((a) =>
              a.id === id ? { ...a, mentorship_interest } : a,
            ),
          };
        },
      );
    },
    onError: (e: Error) => {
      // Roll back by refetching the real server state.
      queryClient.invalidateQueries({ queryKey: ["alumni"] });
      toast.error(e.message);
    },
    onSettled: () => {
      // Always sync with the server after the mutation settles.
      queryClient.invalidateQueries({ queryKey: ["alumni"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alumni"] });
      setSelected((prev) => {
        const next = new Set(prev);
        if (deleteTarget?.type === "single") next.delete(deleteTarget.id);
        return next;
      });
      setDeleteTarget(null);
      toast.success("Alumni deleted");
    },
    onError: (e: Error) => { toast.error(e.message); setDeleteTarget(null); },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteFn({ data: { ids } }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["alumni"] });
      setSelected(new Set());
      setDeleteTarget(null);
      toast.success(`Deleted ${res.count} alumni`);
    },
    onError: (e: Error) => { toast.error(e.message); setDeleteTarget(null); },
  });

  const { data: groupsData } = useQuery({
    queryKey: ["groups"],
    queryFn: () => listGroupsFn(),
    enabled: canMutate,
  });
  const availableGroups = groupsData?.groups ?? [];

  const addToGroupMutation = useMutation({
    mutationFn: ({ groupId, alumniIds }: { groupId: string; alumniIds: string[] }) =>
      addToGroupFn({ data: { groupId, alumniIds } }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success(`Added ${res.added} alumni to group`);
      setAddToGroupOpen(false);
      setSelectedGroupId("");
      setSelected(new Set());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === "single") deleteMutation.mutate(deleteTarget.id);
    else bulkDeleteMutation.mutate(deleteTarget.ids);
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allOnPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        rows.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...rows.map((r) => r.id)]));
    }
  }

  function exportCsv() {
    const header = ["name", "email", "company", "job_title", "grad_year", "industry", "mentorship"];
    const lines = [header.join(",")].concat(
      rows.map((r) =>
        [r.full_name, r.email, r.company ?? "", r.job_title ?? "", r.graduation_year ?? "", r.industry ?? "", r.mentorship_interest].join(","),
      ),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "alumni-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} alumni`);
  }

  const activeFilterCount =
    years.length + industries.length + tags.length + (mentorOnly ? 1 : 0);
  const isClean =
    total === 0 && !debouncedQ && activeFilterCount === 0;

  const COLS = canMutate ? 9 : 8;

  return (
    <PageContainer>
      <PageHeader
        title="Alumni"
        description="Every CS graduate in one place. Search, filter, and build the segments that matter."
        actions={
          <>
            {canMutate && (
              <Button variant="outline" asChild>
                <Link to="/alumni/import">
                  <Upload className="size-4" />
                  Import CSV
                </Link>
              </Button>
            )}
            <Button variant="outline" onClick={exportCsv}>
              <Download className="size-4" />
              Export CSV
            </Button>
            {canMutate && (
              <Button onClick={() => navigate({ to: "/alumni/new" })}>
                <Plus className="size-4" />
                Add alumni
              </Button>
            )}
          </>
        }
      />

      {/* Search + filter section — standalone, disconnected from table */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, email, or company…"
              className="pl-10 h-10 bg-background"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Filter button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={activeFilterCount > 0 ? "default" : "outline"}
                className="h-10 shrink-0 gap-2"
              >
                <SlidersHorizontal className="size-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-0.5 h-5 min-w-5 px-1 text-xs bg-background/20 text-inherit border-0"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[440px] p-0" align="end" sideOffset={8}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Filters</span>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {activeFilterCount} active
                    </Badge>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => { setYears([]); setIndustries([]); setTags([]); setMentorOnly(false); setYearSearch(""); }}
                  >
                    Clear all
                  </Button>
                )}
              </div>

              <div className="divide-y divide-border">
                {/* Graduation year */}
                <div className="px-4 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Graduation Year
                    </p>
                    {years.length > 0 && (
                      <span className="text-xs font-medium text-primary">{years.length} selected</span>
                    )}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      value={yearSearch}
                      onChange={(e) => setYearSearch(e.target.value)}
                      placeholder="Search years…"
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-6 gap-1 max-h-36 overflow-y-auto pr-0.5">
                    {allYears
                      .filter((y) => !yearSearch || String(y).includes(yearSearch))
                      .map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() =>
                            setYears((prev) =>
                              prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y],
                            )
                          }
                          className={cn(
                            "rounded px-1.5 py-1 text-xs font-medium transition-colors text-center",
                            years.includes(y)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground hover:bg-muted/60",
                          )}
                        >
                          {y}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Industry */}
                <div className="px-4 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Industry
                    </p>
                    {industries.length > 0 && (
                      <span className="text-xs font-medium text-primary">{industries.length} selected</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {INDUSTRY_OPTIONS.map((ind) => (
                      <button
                        key={ind}
                        type="button"
                        onClick={() =>
                          setIndustries((prev) =>
                            prev.includes(ind) ? prev.filter((x) => x !== ind) : [...prev, ind],
                          )
                        }
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                          industries.includes(ind)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground hover:bg-muted/60",
                        )}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="px-4 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Tags
                    </p>
                    {tags.length > 0 && (
                      <span className="text-xs font-medium text-primary">{tags.length} selected</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {TAG_OPTIONS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setTags((prev) =>
                            prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag],
                          )
                        }
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                          tags.includes(tag)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground hover:bg-muted/60",
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mentorship */}
                <div className="px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                        Mentorship
                      </p>
                      <p className="text-sm text-foreground">Open to mentoring students</p>
                    </div>
                    <Switch checked={mentorOnly} onCheckedChange={setMentorOnly} />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {years.map((y) => (
              <Badge key={y} variant="secondary" className="gap-1 pl-2 pr-1 h-6 text-xs font-normal">
                {y}
                <button
                  type="button"
                  onClick={() => setYears(years.filter((x) => x !== y))}
                  className="ml-0.5 rounded-sm opacity-60 hover:opacity-100 transition-opacity"
                  aria-label={`Remove year ${y}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            {industries.map((ind) => (
              <Badge key={ind} variant="secondary" className="gap-1 pl-2 pr-1 h-6 text-xs font-normal">
                {ind}
                <button
                  type="button"
                  onClick={() => setIndustries(industries.filter((x) => x !== ind))}
                  className="ml-0.5 rounded-sm opacity-60 hover:opacity-100 transition-opacity"
                  aria-label={`Remove industry ${ind}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 pl-2 pr-1 h-6 text-xs font-normal">
                {tag}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((x) => x !== tag))}
                  className="ml-0.5 rounded-sm opacity-60 hover:opacity-100 transition-opacity"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            {mentorOnly && (
              <Badge variant="secondary" className="gap-1 pl-2 pr-1 h-6 text-xs font-normal">
                Mentor only
                <button
                  type="button"
                  onClick={() => setMentorOnly(false)}
                  className="ml-0.5 rounded-sm opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="Remove mentor filter"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}
            <button
              type="button"
              onClick={() => { setYears([]); setIndustries([]); setTags([]); setMentorOnly(false); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {canMutate && selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 mb-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium text-foreground">
            {selected.size} {selected.size === 1 ? "alumni" : "alumni"} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Clear selection
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddToGroupOpen(true)}
            >
              <Users2 className="size-3.5" />
              Add to group
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteTarget({ type: "bulk", ids: [...selected] })}
            >
              <Trash2 className="size-3.5" />
              Delete {selected.size}
            </Button>
          </div>
        </div>
      )}

      {/* Table — clean card, no toolbar inside */}
      <Card className="overflow-hidden">
        {/* Table */}
        <Table className="[&_thead_th]:h-9 [&_thead_th]:px-3 [&_thead_th]:text-xs [&_tbody_td]:px-3 [&_tbody_td]:py-1.5 [&_tbody_td]:text-sm">
          <TableHeader>
            <TableRow>
              {canMutate && (
                <TableHead className="w-9 px-3">
                  <Checkbox
                    checked={allOnPageSelected}
                    data-state={someOnPageSelected && !allOnPageSelected ? "indeterminate" : undefined}
                    onCheckedChange={toggleAll}
                    aria-label="Select all on this page"
                  />
                </TableHead>
              )}
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead className="w-20">Grad Year</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-16">{canMutate ? "Mentor" : "Mentorship"}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {canMutate && <TableCell className="w-9"><Skeleton className="h-4 w-4" /></TableCell>}
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell><div className="flex gap-1"><Skeleton className="h-5 w-12 rounded-full" /><Skeleton className="h-5 w-12 rounded-full" /></div></TableCell>
                  <TableCell><Skeleton className="h-5 w-8 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-6 ml-auto rounded" /></TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLS} className="py-12">
                  <EmptyState
                    icon={Users}
                    title={isClean ? "No alumni yet" : "No alumni match your filters"}
                    description={
                      isClean
                        ? "Add your first alumni record or import a CSV to get started."
                        : "Try adjusting your search or clearing some filters."
                    }
                    action={
                      canMutate && isClean ? (
                        <Button onClick={() => navigate({ to: "/alumni/new" })}>
                          <Plus className="size-4" />
                          Add alumni
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((a) => (
                <TableRow
                  key={a.id}
                  className={cn(
                    "cursor-pointer",
                    isFetching && "opacity-60",
                    selected.has(a.id) && "bg-primary/5",
                  )}
                  onClick={() => navigate({ to: "/alumni/$id", params: { id: a.id } })}
                >
                  {canMutate && (
                    <TableCell className="w-9" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.has(a.id)}
                        onCheckedChange={() => toggleRow(a.id)}
                        aria-label={`Select ${a.full_name}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{a.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{a.email}</TableCell>
                  <TableCell>{a.company ?? "—"}</TableCell>
                  <TableCell>{a.job_title ?? "—"}</TableCell>
                  <TableCell>{a.graduation_year ?? "—"}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <TagsCell row={a} canMutate={canMutate} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {canMutate ? (
                      <Switch
                        checked={a.mentorship_interest}
                        onCheckedChange={(v) =>
                          mentorMutation.mutate({ id: a.id, mentorship_interest: v })
                        }
                        aria-label="Toggle mentor interest"
                      />
                    ) : (
                      a.mentorship_interest && (
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          Mentor
                        </Badge>
                      )
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 data-[state=open]:bg-muted"
                          aria-label="Row actions"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            navigate({ to: "/alumni/$id", params: { id: a.id } })
                          }
                        >
                          <Eye className="size-4" />
                          View profile
                        </DropdownMenuItem>
                        {canMutate && (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                navigate({ to: "/alumni/$id/edit", params: { id: a.id } })
                              }
                            >
                              <Pencil className="size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() =>
                                setDeleteTarget({ type: "single", id: a.id, name: a.full_name })
                              }
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination bar */}
        {!isLoading && total > 0 && (
          <div className="flex items-center justify-between gap-4 border-t border-border px-3 py-2">
            <span className="text-xs text-muted-foreground">
              {firstOnPage}–{lastOnPage} of {total}
            </span>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                disabled={page === 1 || isFetching} onClick={() => setPage(1)}
                aria-label="First page"
              >
                <ChevronLeft className="size-3.5" /><ChevronLeft className="size-3.5 -ml-2.5" />
              </Button>
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                disabled={page === 1 || isFetching} onClick={() => setPage((p) => p - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <PageNumbers current={page} total={totalPages} onChange={setPage} disabled={isFetching} />
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                disabled={page === totalPages || isFetching} onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="size-3.5" />
              </Button>
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                disabled={page === totalPages || isFetching} onClick={() => setPage(totalPages)}
                aria-label="Last page"
              >
                <ChevronRight className="size-3.5" /><ChevronRight className="size-3.5 -ml-2.5" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => setPageSize(Number(v) as PageSize)}
              >
                <SelectTrigger className="h-7 w-16 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </Card>

      {/* Add to group dialog */}
      <Dialog open={addToGroupOpen} onOpenChange={(o) => { setAddToGroupOpen(o); if (!o) setSelectedGroupId(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add {selected.size} {selected.size === 1 ? "alumnus" : "alumni"} to group</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {availableGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No groups yet.{" "}
                <a href="/groups/new" className="text-primary hover:underline">Create a group first.</a>
              </p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {availableGroups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGroupId(g.id)}
                    className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm text-left transition-colors ${
                      selectedGroupId === g.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                    }`}
                  >
                    <span>{g.name}</span>
                    <Badge variant="secondary" className="text-xs">{g.member_count}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToGroupOpen(false)}>Cancel</Button>
            <Button
              disabled={!selectedGroupId || addToGroupMutation.isPending}
              loading={addToGroupMutation.isPending}
              onClick={() =>
                addToGroupMutation.mutate({ groupId: selectedGroupId, alumniIds: [...selected] })
              }
            >
              Add to group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === "bulk"
                ? `Delete ${deleteTarget.ids.length} alumni?`
                : `Delete ${deleteTarget?.type === "single" ? deleteTarget.name : ""}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "bulk"
                ? `This will permanently delete ${deleteTarget.ids.length} alumni records. Any campaign or survey responses linked to these records will lose their alumni association. This cannot be undone.`
                : `This will permanently delete this alumni record. Any campaign or survey responses linked to them will lose their alumni association. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              {deleteMutation.isPending || bulkDeleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

// ─── Page number buttons ──────────────────────────────────────────────────

function PageNumbers({
  current,
  total,
  onChange,
  disabled,
}: {
  current: number;
  total: number;
  onChange: (p: number) => void;
  disabled: boolean;
}) {
  if (total <= 1) return null;

  const pages: (number | "…")[] = [];
  const add = (n: number) => { if (!pages.includes(n)) pages.push(n); };

  add(1);
  if (current > 3) pages.push("…");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) add(i);
  if (current < total - 2) pages.push("…");
  add(total);

  return (
    <div className="flex items-center gap-1">
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`} className="px-1 text-xs text-muted-foreground select-none">…</span>
        ) : (
          <Button
            key={p}
            variant={p === current ? "default" : "ghost"}
            size="icon"
            className="h-7 w-7 text-xs"
            disabled={disabled}
            onClick={() => onChange(p)}
          >
            {p}
          </Button>
        ),
      )}
    </div>
  );
}

