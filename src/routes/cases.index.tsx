import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill } from "@/components/AppShell";
import { useEffect, useState, useMemo } from "react";
import { Inbox, Search, Plus, Loader2, FlaskConical, User, Calendar } from "lucide-react";

const API_URL = "https://chemosense-backend.onrender.com/api";

export const Route = createFileRoute("/cases/")({
  component: () => <AppShell><Page /></AppShell>,
  head: () => ({ meta: [{ title: "Cases — ChemoSense" }] }),
});

function Page() {
  const [cases, setCases] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/cases`).then(r => r.json()),
      fetch(`${API_URL}/scans`).then(r => r.json()),
    ]).then(([c, s]) => {
      setCases(Array.isArray(c) ? c : []);
      setScans(Array.isArray(s) ? s : []);
    }).finally(() => setLoading(false));
  }, []);

  // Build scan lookup by case_id
  const scansByCase = useMemo(() => {
    const map: Record<number, any[]> = {};
    scans.forEach(s => {
      if (s.case_id) {
        if (!map[s.case_id]) map[s.case_id] = [];
        map[s.case_id].push(s);
      }
    });
    return map;
  }, [scans]);

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

  const openCount = cases.filter(c => c.status === "open").length;
  const criticalCount = cases.filter(c => {
    const s = scansByCase[c.id];
    return s?.some(sc => sc.risk_level === "Critical");
  }).length;

  return (
    <>
      <PageHeader
        title="Cases"
        subtitle={`${cases.length} total · ${openCount} open · ${criticalCount} critical`}
        actions={
          <Link to="/scan" className="h-9 px-3 text-xs rounded-md bg-primary text-primary-foreground inline-flex items-center gap-1.5 font-medium">
            <Plus className="size-3.5" /> New scan
          </Link>
        }
      />
      <div className="px-4 md:px-6 py-6 max-w-5xl">

        {/* Summary strips */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Total Cases", value: cases.length, color: "text-foreground" },
            { label: "Open", value: openCount, color: "text-amber-600" },
            { label: "Critical", value: criticalCount, color: "text-destructive" },
          ].map(s => (
            <div key={s.label} className="clinical-card p-3 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by patient, pathogen, case ID…"
              className="w-full h-9 pl-8 pr-3 text-sm border border-input rounded-md bg-background" />
          </div>
          <div className="flex gap-1">
            {["All", "open", "closed"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`h-9 px-3 text-xs rounded-md border font-medium transition-colors ${
                  statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"
                }`}>
                {s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
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
          {filtered.map(c => {
            const linkedScans = scansByCase[c.id] || [];
            const topScan = linkedScans[0];
            const riskLevel = topScan?.risk_level;
            const pathogen = topScan?.pathogen_name;
            const doctor = topScan?.scanned_by;

            return (
              <Link key={c.id} to="/cases/$id" params={{ id: String(c.id) }}
                className={`clinical-card p-4 flex items-center gap-4 hover:bg-muted/50 transition-all block border-l-4 ${
                  riskLevel === "Critical" ? "border-l-destructive" :
                  riskLevel === "High" ? "border-l-amber-400" :
                  c.status === "closed" ? "border-l-emerald-400" :
                  "border-l-border"
                }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold truncate">{c.title || `Case #${c.id}`}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${
                      c.status === "open" ? "bg-amber-50 text-amber-700 border-amber-300" :
                      c.status === "closed" ? "bg-emerald-50 text-emerald-700 border-emerald-300" :
                      "bg-slate-50 text-slate-600 border-slate-300"
                    }`}>{c.status?.toUpperCase()}</span>
                    {riskLevel && <RiskPill level={riskLevel} />}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="size-3" /> <span className="font-mono">{c.patient_id || c.patient_name || "—"}</span>
                    </span>
                    {pathogen && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <FlaskConical className="size-3 text-primary" />
                        <span className="italic text-foreground font-medium">{pathogen}</span>
                      </span>
                    )}
                    {doctor && (
                      <span className="text-xs text-muted-foreground">{doctor}</span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3" /> {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {linkedScans.length > 1 && (
                    <div className="mt-1.5 text-[10px] text-muted-foreground">
                      {linkedScans.length} scans linked
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground shrink-0 font-mono">#{c.id} →</div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
