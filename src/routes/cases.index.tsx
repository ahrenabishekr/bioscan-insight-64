import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill } from "@/components/AppShell";
import { useEffect, useState, useMemo } from "react";
import { Inbox, Search, Plus, Loader2 } from "lucide-react";

const API_URL = "https://chemosense-backend-production.up.railway.app/api";

export const Route = createFileRoute("/cases/")({
  component: () => <AppShell><Page /></AppShell>,
  head: () => ({ meta: [{ title: "Cases — ChemoSense" }] }),
});

function Page() {
  const [cases, setCases] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/cases`)
      .then(r => r.json())
      .then(data => setCases(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...cases];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.patient_id?.toLowerCase().includes(q) ||
        c.patient_name?.toLowerCase().includes(q) ||
        String(c.id).includes(q)
      );
    }
    if (statusFilter !== "All") {
      result = result.filter(c => c.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    return result;
  }, [cases, search, statusFilter]);

  return (
    <>
      <PageHeader
        title="Cases"
        subtitle={`${cases.length} total · ${cases.filter(c => c.status === "open").length} open`}
        actions={
          <Link to="/scan" className="h-9 px-3 text-xs rounded-md bg-primary text-primary-foreground inline-flex items-center gap-1.5">
            <Plus className="size-3.5" /> New scan
          </Link>
        }
      />
      <div className="px-6 py-6 max-w-5xl">
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search cases…"
              className="w-full h-9 pl-8 pr-3 text-sm border border-input rounded-md bg-background" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-sm border border-input rounded-md bg-background">
            {["All", "open", "closed", "pending"].map(s => (
              <option key={s} value={s}>{s === "All" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
            <Loader2 className="size-4 animate-spin" /> Loading cases…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="clinical-card p-10 text-center">
            <Inbox className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {cases.length === 0 ? "No cases yet. Run a scan to create one." : "No cases match your search."}
            </p>
            {cases.length === 0 && (
              <Link to="/scan" className="mt-3 inline-flex h-9 px-4 text-xs rounded-md bg-primary text-primary-foreground items-center gap-1.5">
                <Plus className="size-3.5" /> Run first scan
              </Link>
            )}
          </div>
        )}

        <div className="space-y-2">
          {filtered.map(c => (
            <Link key={c.id} to="/cases/$id" params={{ id: String(c.id) }}
              className="clinical-card p-4 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors block">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium truncate">{c.title || `Case #${c.id}`}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${
                    c.status === "open" ? "bg-amber-50 text-amber-700 border-amber-300" :
                    c.status === "closed" ? "bg-emerald-50 text-emerald-700 border-emerald-300" :
                    "bg-slate-50 text-slate-600 border-slate-300"
                  }`}>{c.status?.toUpperCase()}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Patient: <span className="font-mono">{c.patient_id || c.patient_name || "—"}</span>
                  · {new Date(c.created_at).toLocaleDateString()}
                </div>
                {c.notes && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{c.notes}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">#{c.id} →</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
