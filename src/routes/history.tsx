import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill } from "@/components/AppShell";
import { useEffect, useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus, Activity, AlertTriangle, Search, Filter, Loader2 } from "lucide-react";

const API_URL = "https://chemosense-backend.onrender.com/api";

export const Route = createFileRoute("/history")({
  component: () => <AppShell><Page /></AppShell>,
  head: () => ({ meta: [{ title: "Scan History — ChemoSense" }] }),
});

function Page() {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/scans`)
      .then(r => r.json())
      .then(data => {
        setScans(data);
        const unique = [...new Set(data.map((s: any) => s.patient_id).filter(Boolean))] as string[];
        setPatients(unique);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...scans];
    if (patientId) result = result.filter(s => s.patient_id === patientId);
    if (riskFilter !== "All") result = result.filter(s => s.risk_level === riskFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.pathogen_name?.toLowerCase().includes(q) ||
        s.biomarker_name?.toLowerCase().includes(q) ||
        s.patient_id?.toLowerCase().includes(q) ||
        s.scanned_by?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [scans, patientId, riskFilter, search]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filtered.forEach(s => {
      const date = new Date(s.created_at).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      if (!groups[date]) groups[date] = [];
      groups[date].push(s);
    });
    return Object.entries(groups);
  }, [filtered]);

  // Trend chart data
  const trendData = useMemo(() =>
    filtered.filter(s => s.value)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((s, i) => ({ i: i + 1, value: parseFloat(s.value), date: new Date(s.created_at).toLocaleDateString() })),
    [filtered]);

  const trend = useMemo(() => {
    if (trendData.length < 2) return "stable";
    const first = trendData[0].value, last = trendData[trendData.length - 1].value;
    return last > first * 1.1 ? "up" : last < first * 0.9 ? "down" : "stable";
  }, [trendData]);

  const criticalCount = filtered.filter(s => s.risk_level === "Critical").length;
  const highCount = filtered.filter(s => s.risk_level === "High").length;

  return (
    <>
      <PageHeader title="Scan History" subtitle={`${filtered.length} scans · ${criticalCount} critical · ${highCount} high`} />
      <div className="px-4 md:px-6 py-6 max-w-5xl space-y-5">

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="clinical-card p-3 text-center">
            <div className="text-2xl font-bold text-primary">{filtered.length}</div>
            <div className="text-[10px] text-muted-foreground">Total Scans</div>
          </div>
          <div className="clinical-card p-3 text-center">
            <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
            <div className="text-[10px] text-muted-foreground">Critical</div>
          </div>
          <div className="clinical-card p-3 text-center">
            <div className="flex justify-center mb-0.5">
              {trend === "up" && <TrendingUp className="size-5 text-destructive" />}
              {trend === "down" && <TrendingDown className="size-5 text-emerald-500" />}
              {trend === "stable" && <Minus className="size-5 text-amber-500" />}
            </div>
            <div className="text-[10px] text-muted-foreground">Trend</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search pathogen, patient, doctor…"
              className="w-full h-9 pl-8 pr-3 text-sm border border-input rounded-md bg-background" />
          </div>
          <select value={patientId} onChange={e => setPatientId(e.target.value)}
            className="h-9 px-3 text-sm border border-input rounded-md bg-background">
            <option value="">All patients</option>
            {patients.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="flex gap-1">
            {["All", "Critical", "High", "Moderate"].map(r => (
              <button key={r} onClick={() => setRiskFilter(r)}
                className={`h-9 px-3 text-xs rounded-md border font-medium transition-colors ${
                  riskFilter === r ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"
                }`}>{r}</button>
            ))}
          </div>
        </div>

        {/* Trend chart */}
        {trendData.length > 1 && (
          <div className="clinical-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">Biomarker Concentration Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v: any) => [`${v} nM`, "Value"]} />
                <Line type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            {trend === "up" && (
              <div className="flex items-center gap-2 mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded-lg">
                <AlertTriangle className="size-3" /> Biomarker levels rising — consider immediate clinical review
              </div>
            )}
          </div>
        )}

        {/* Grouped scan list */}
        {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground py-8"><Loader2 className="size-4 animate-spin" /> Loading…</div>}

        {!loading && filtered.length === 0 && (
          <div className="clinical-card p-8 text-center text-sm text-muted-foreground">No scans match your filters.</div>
        )}

        {grouped.map(([date, dayScans]) => (
          <div key={date}>
            {/* Date header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{date}</div>
              <div className="flex-1 h-px bg-border" />
              <div className="text-[10px] text-muted-foreground">{dayScans.length} scan{dayScans.length > 1 ? "s" : ""}</div>
            </div>

            <div className="space-y-2">
              {dayScans.map((scan, i) => (
                <div key={i} className={`clinical-card p-4 border-l-4 ${
                  scan.risk_level === "Critical" ? "border-l-destructive" :
                  scan.risk_level === "High" ? "border-l-amber-400" :
                  scan.risk_level === "Moderate" ? "border-l-blue-400" :
                  "border-l-emerald-400"
                }`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold italic">{scan.pathogen_name || "Unknown"}</span>
                        <RiskPill level={scan.risk_level} />
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                        <span>🧪 {scan.biomarker_name || "—"}</span>
                        <span>👤 <span className="font-mono">{scan.patient_id || "—"}</span></span>
                        <span>👨‍⚕️ {scan.scanned_by || "—"}</span>
                        {scan.notes && <span>📝 {scan.notes}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {scan.value && <div className="text-sm font-mono text-primary font-bold">{scan.value} {scan.unit}</div>}
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(scan.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      {scan.case_id && (
                        <Link to="/cases/$id" params={{ id: String(scan.case_id) }}
                          className="text-[10px] text-primary hover:underline">Case #{scan.case_id} →</Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
