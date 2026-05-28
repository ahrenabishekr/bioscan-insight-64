import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { AlertTriangle, Users, Activity, Clock, TrendingUp, Shield, Loader2, RefreshCw } from "lucide-react";

const API_URL = "https://chemosense-backend-production.up.railway.app/api";

export const Route = createFileRoute("/outbreaks")({
  component: () => <AppShell><Page /></AppShell>,
  head: () => ({ meta: [{ title: "Outbreak Detection — ChemoSense" }] }),
});

function Page() {
  const [outbreaks, setOutbreaks] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  async function load() {
    setLoading(true);
    try {
      const [o, w] = await Promise.all([
        fetch(`${API_URL}/outbreaks`).then(r => r.json()),
        fetch(`${API_URL}/ward-heatmap`).then(r => r.json()),
      ]);
      setOutbreaks(Array.isArray(o) ? o : []);
      setWards(Array.isArray(w) ? w : []);
      setLastUpdated(new Date());
    } finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const maxTotal = Math.max(...wards.map(w => w.total), 1);

  return (
    <>
      <PageHeader title="Outbreak Detection"
        subtitle="Real-time surveillance — auto-flags when 3+ patients share pathogen within 48h"
        actions={
          <button onClick={load} disabled={loading}
            className="h-8 px-3 text-xs rounded-md border border-border inline-flex items-center gap-1.5 text-muted-foreground hover:bg-muted disabled:opacity-50">
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        }
      />
      <div className="px-6 py-6 max-w-5xl space-y-6">

        {/* Last updated */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          Last updated: {lastUpdated.toLocaleTimeString()} · Auto-refreshes every 60s
          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
          </span>
        </div>

        {/* Outbreak alerts */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="size-4 text-destructive" />
            <h2 className="text-sm font-semibold">Active Outbreak Alerts</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">{outbreaks.length} detected</span>
          </div>

          {loading && <div className="clinical-card p-8 text-center"><Loader2 className="size-5 animate-spin text-muted-foreground mx-auto" /></div>}

          {!loading && outbreaks.length === 0 && (
            <div className="clinical-card p-6 flex items-center gap-4 bg-emerald-50/50 border-emerald-200">
              <div className="size-10 rounded-full bg-emerald-100 grid place-items-center shrink-0">
                <Shield className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-700">No Active Outbreaks</p>
                <p className="text-xs text-muted-foreground mt-0.5">No pathogen has been detected in 3+ patients within the last 48 hours.</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {outbreaks.map((o, i) => (
              <div key={i} className="clinical-card p-5 border-l-4 border-l-destructive bg-destructive/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="size-4 text-destructive" />
                      <span className="text-sm font-bold text-destructive">OUTBREAK ALERT</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-destructive text-white font-bold">{o.case_count} cases</span>
                    </div>
                    <div className="text-base font-semibold italic">{o.pathogen_name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      First detected: {new Date(o.first_seen).toLocaleString()} · Last: {new Date(o.last_seen).toLocaleString()}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <div className="text-xs bg-background border border-border rounded-md px-2 py-1">
                        <span className="text-muted-foreground">Patients: </span>
                        <span className="font-mono font-medium">{o.patients?.split(",").join(", ")}</span>
                      </div>
                      <div className="text-xs bg-background border border-border rounded-md px-2 py-1">
                        <span className="text-muted-foreground">Doctors: </span>
                        <span className="font-medium">{o.doctors?.split(",").join(", ")}</span>
                      </div>
                    </div>
                  </div>
                  <Link to="/cases"
                    className="h-9 px-3 text-xs rounded-md bg-destructive text-white inline-flex items-center gap-1.5 shrink-0">
                    View Cases →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ward infection heatmap */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Ward Infection Load</h2>
            <span className="text-xs text-muted-foreground">Based on all positive scans</span>
          </div>

          {!loading && wards.length === 0 && (
            <div className="clinical-card p-5 text-sm text-muted-foreground text-center">No scan data available.</div>
          )}

          <div className="space-y-3">
            {wards.sort((a, b) => b.critical - a.critical).map((w, i) => (
              <div key={i} className="clinical-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`size-8 rounded-lg grid place-items-center text-white text-xs font-bold ${w.critical > 0 ? "bg-destructive" : "bg-amber-500"}`}>
                      {w.ward.split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{w.ward}</div>
                      <div className="text-xs text-muted-foreground">{w.total} total scans · {w.critical} critical</div>
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full font-medium border ${w.critical > 0 ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-amber-50 text-amber-700 border-amber-300"}`}>
                    {w.critical > 0 ? "⚠ Critical load" : "Moderate"}
                  </div>
                </div>

                {/* Load bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                  <div className={`h-full rounded-full transition-all ${w.critical > 0 ? "bg-destructive" : "bg-amber-400"}`}
                    style={{ width: `${(w.total / maxTotal) * 100}%` }} />
                </div>

                {/* Pathogen tags */}
                <div className="flex flex-wrap gap-1.5">
                  {w.pathogens.slice(0, 5).map((p: any, j: number) => (
                    <span key={j} className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                      p.risk === "Critical" ? "bg-destructive/10 text-destructive border-destructive/30" :
                      p.risk === "High" ? "bg-amber-50 text-amber-700 border-amber-300" :
                      "bg-blue-50 text-blue-700 border-blue-300"
                    }`}>
                      {p.name?.split(" ")[0]} ×{p.count}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Active Outbreaks", value: outbreaks.length, icon: AlertTriangle, color: outbreaks.length > 0 ? "text-destructive bg-destructive/10" : "text-emerald-600 bg-emerald-50" },
            { label: "Wards Monitored", value: wards.length, icon: Users, color: "text-primary bg-primary/10" },
            { label: "Total Infections", value: wards.reduce((a, w) => a + w.total, 0), icon: TrendingUp, color: "text-amber-600 bg-amber-50" },
            { label: "Critical Cases", value: wards.reduce((a, w) => a + w.critical, 0), icon: Shield, color: "text-violet-600 bg-violet-50" },
          ].map(s => (
            <div key={s.label} className="clinical-card p-4 flex items-center gap-3">
              <div className={`size-9 rounded-lg grid place-items-center shrink-0 ${s.color}`}>
                <s.icon className="size-4" />
              </div>
              <div>
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
