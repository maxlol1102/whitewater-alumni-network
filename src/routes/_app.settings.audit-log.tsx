import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { listAuditLogs, type AuditLogRow } from "@/lib/audit.functions";
import { listUsers } from "@/lib/users.functions";

export const Route = createFileRoute("/_app/settings/audit-log")({ component: AuditLogPage });

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-muted text-muted-foreground border-transparent",
  warning: "bg-warning/15 text-warning-foreground border-warning/30",
  critical: "bg-destructive/15 text-destructive border-destructive/30",
};

function AuditLogPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user && user.account_role !== "admin") navigate({ to: "/dashboard" }); }, [user, navigate]);

  const [q, setQ] = useState("");
  const [actor, setActor] = useState("all");
  const [action, setAction] = useState("all");
  const [entity, setEntity] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const listFn = useServerFn(listAuditLogs);
  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => listFn(),
    enabled: user?.account_role === "admin",
  });
  const allRows = useMemo(() => data?.logs ?? [], [data]);

  const listUsersFn = useServerFn(listUsers);
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => listUsersFn(),
    enabled: user?.account_role === "admin",
  });
  const users = usersData?.users ?? [];

  const actions = useMemo(() => Array.from(new Set(allRows.map((l) => l.action))).sort(), [allRows]);
  const entities = useMemo(() => Array.from(new Set(allRows.map((l) => l.entity_type))).sort(), [allRows]);

  const rows = useMemo(() => allRows.filter((l: AuditLogRow) => {
    if (q && !`${l.summary} ${l.entity_label ?? ""} ${l.actor_email ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (actor !== "all" && l.actor_id !== actor) return false;
    if (action !== "all" && l.action !== action) return false;
    if (entity !== "all" && l.entity_type !== entity) return false;
    if (from && new Date(l.created_at) < new Date(from)) return false;
    if (to && new Date(l.created_at) > new Date(to)) return false;
    return true;
  }), [allRows, q, actor, action, entity, from, to]);

  function exportCsv() {
    const header = ["timestamp", "actor", "role", "action", "entity_type", "entity", "summary", "severity", "ip"];
    const lines = [header.join(",")].concat(rows.map((r) => [r.created_at, r.actor_email ?? "", r.actor_role ?? "", r.action, r.entity_type, r.entity_label ?? "", `"${(r.summary ?? "").replace(/"/g, '""')}"`, r.severity, r.ip_address ?? ""].join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audit-log-export.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} log entries`);
  }

  return (
    <PageContainer>
      <PageHeader title="Audit Log" description="Append-only record of important activity in the system." actions={<Button variant="outline" onClick={exportCsv}><Download className="size-4" />Export CSV</Button>} />

      <Card className="p-4 mb-4">
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-2">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-8" />
          </div>
          <Select value={actor} onValueChange={setActor}>
            <SelectTrigger><SelectValue placeholder="Actor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actors</SelectItem>
              {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={entity} onValueChange={setEntity}>
            <SelectTrigger><SelectValue placeholder="Entity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entities</SelectItem>
              {entities.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
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
        <Table>
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
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No log entries match your filters.</TableCell></TableRow>
            ) : (
              rows.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="font-medium">{l.actor_email ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{l.actor_role ?? ""}</div>
                  </TableCell>
                  <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{l.action}</code></TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">{l.entity_type}</div>
                    <div>{l.entity_label ?? "—"}</div>
                  </TableCell>
                  <TableCell className="max-w-xs"><div className="text-sm">{l.summary}</div></TableCell>
                  <TableCell><Badge className={`${SEVERITY_STYLES[l.severity] ?? SEVERITY_STYLES.info} capitalize`}>{l.severity}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.ip_address ?? ""}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </PageContainer>
  );
}
