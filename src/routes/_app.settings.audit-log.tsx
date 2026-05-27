import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { listAuditLogs, getAuditLogFilters, type AuditLogRow } from "@/lib/audit.functions";
import { listUsers } from "@/lib/users.functions";

export const Route = createFileRoute("/_app/settings/audit-log")({
  component: AuditLogPage,
});

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-muted text-muted-foreground border-transparent",
  warning: "bg-warning/15 text-warning-foreground border-warning/30",
  critical: "bg-destructive/15 text-destructive border-destructive/30",
};

function AuditLogPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user && user.account_role !== "admin") navigate({ to: "/dashboard" });
  }, [user, navigate]);

  // Filter state
  const [inputQ, setInputQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [actor, setActor] = useState("all");
  const [action, setAction] = useState("all");
  const [entity, setEntity] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(inputQ), 350);
    return () => clearTimeout(t);
  }, [inputQ]);

  // Reset page on any filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, actor, action, entity, from, to]);

  const isAdmin = user?.account_role === "admin";

  const listFn = useServerFn(listAuditLogs);
  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", { debouncedQ, actor, action, entity, from, to, page }],
    queryFn: () =>
      listFn({
        data: {
          q: debouncedQ || undefined,
          actor_id: actor !== "all" ? actor : undefined,
          action: action !== "all" ? action : undefined,
          entity_type: entity !== "all" ? entity : undefined,
          from: from || undefined,
          to: to || undefined,
          page,
        },
      }),
    enabled: isAdmin,
    placeholderData: (prev) => prev,
  });

  const rows = data?.logs ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  // Filter metadata (distinct actions + entity types)
  const filtersFn = useServerFn(getAuditLogFilters);
  const { data: filtersData } = useQuery({
    queryKey: ["audit-log-filters"],
    queryFn: () => filtersFn(),
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const listUsersFn = useServerFn(listUsers);
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => listUsersFn(),
    enabled: isAdmin,
  });
  const users = usersData?.users ?? [];

  function exportCsv() {
    const header = [
      "timestamp",
      "actor",
      "role",
      "action",
      "entity_type",
      "entity",
      "summary",
      "severity",
      "ip",
    ];
    const lines = [header.join(",")].concat(
      rows.map((r) =>
        [
          r.created_at,
          r.actor_email ?? "",
          r.actor_role ?? "",
          r.action,
          r.entity_type,
          r.entity_label ?? "",
          `"${(r.summary ?? "").replace(/"/g, '""')}"`,
          r.severity,
          r.ip_address ?? "",
        ].join(","),
      ),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-log-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} log entries`);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Audit Log"
        description="Every admin action, timestamped and immutable. Nothing here can be edited or deleted."
        actions={
          <Button variant="outline" onClick={exportCsv}>
            <Download className="size-4" />
            Export CSV
          </Button>
        }
      />

      <Card className="p-4 mb-4">
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-2">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={inputQ}
              onChange={(e) => setInputQ(e.target.value)}
              placeholder="Search…"
              className="pl-8"
            />
          </div>
          <Select value={actor} onValueChange={setActor}>
            <SelectTrigger>
              <SelectValue placeholder="Actor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actors</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger>
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {(filtersData?.actions ?? []).map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={entity} onValueChange={setEntity}>
            <SelectTrigger>
              <SelectValue placeholder="Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entities</SelectItem>
              {(filtersData?.entityTypes ?? []).map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangePicker
            from={from}
            to={to}
            onFromChange={setFrom}
            onToChange={setTo}
            className="lg:col-span-2"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table className="text-xs [&_td]:py-2 [&_td]:px-3 [&_th]:py-2 [&_th]:px-3">
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-3 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-20" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No log entries match your filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((l: AuditLogRow) => (
                <TableRow key={l.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap tabular-nums">
                    {new Date(l.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{l.actor_email ?? "—"}</TableCell>
                  <TableCell>
                    <code className="bg-muted px-1.5 py-0.5 rounded">{l.action}</code>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span>{l.entity_type}</span>
                    {l.entity_label && <span className="text-foreground"> · {l.entity_label}</span>}
                  </TableCell>
                  <TableCell className="max-w-xs text-muted-foreground">{l.summary}</TableCell>
                  <TableCell>
                    <Badge
                      className={`text-[10px] px-1.5 py-0 ${SEVERITY_STYLES[l.severity] ?? SEVERITY_STYLES.info} capitalize`}
                    >
                      {l.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{l.ip_address ?? ""}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {rangeStart}–{rangeEnd} of {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <span className="px-3 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
