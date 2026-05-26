import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { Users, TrendingUp, AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const API_URL = "https://chemosense-backend-production.up.railway.app/api";

export const Route = createFileRoute("/patients")({
  component: () => <AppShell><PatientsPage /></AppShell>,
  head: () => ({ meta: [{ title: "Patients — ChemoSense" }] }),
});

function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [timeline, setTimeline] = useState<{ scans: any[]; cases: any[] }>({ scans: [], cases: [] });
  const [loading, setLoading] = useState(true);
  const [tlLoading, setTlLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/patients`)
      .then(r => r.json())
      .then(data => { setPatients(Array.isArray(data) ? data : []); })
      .finally(() => setLoading(false));
  }, []);

  async function loadTimeline(patient_id: string) {
    setTlLoading(true);
    try {
      const r = await fetch(`${API_URL}/patients/${encodeURIComponent(patient_id)}/timeline`);
      const data = await r.json();
      setTimeline(data);
    } finally { setTlLoading(false); }
  }

  function selectPatient(p: any) {
    setSelected(p);
    loadTimeline(p.patient_id);
  }

  const riskTrend = timeline.scans.map((s, i) => ({
    i: i + 1,
    risk: s.risk_level === "Critical" ? 4 : s.risk_level === "High" ? 3 : s.risk_level === "Moderate" ? 2 : 1,
    label: s.risk_level,
    date: new Date(s.created_at).toLocaleDateString(),
    pathogen: s.pathogen_name,
  }));

  return (
    <>
      <PageHeader title="Patient Timeline" subtitle="Track infection progression and treatment history per patient" />
      <div className="px-6 py-6 max-w-6xl">
        {loading && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Loading…</p>}

        {!loading && patients.length === 0 && (
          <div className="clinical-card p-8 text-center">
            <Users className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No patients yet. Run scans to populate patient records.</p>
          </div>
        )}

        {patients.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Patient list */}
            <div className="space-y-2">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Patients ({patients.length})</h2>
              {patients.map(p => (
                <button key={p.patient_id} onClick={() => selectPatient(p)}
                  className={`w-full text-left clinical-card p-3 transition-all ${selected?.patient_id === p.patient_id ? "border-primary" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium">{p.patient_id}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                      p.max_risk === "Critical" ? "bg-destructive/10 text-destructive border-destructive/30" :
                      p.max_risk === "High" ? "bg-amber-50 text-amber-700 border-amber-300" :
                      "bg-emerald-50 text-emerald-700 border-emerald-300"
                    }`}>{p.max_risk}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {p.scan_count} scan{p.scan_count > 1 ? "s" : ""} · Last: {new Date(p.last_scan).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>

            {/* Timeline */}
            <div className="lg:col-span-2 space-y-4">
              {!selected && (
                <div className="clinical-card p-8 text-center">
                  <TrendingUp className="size-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Select a patient to view their timeline.</p>
                </div>
              )}

              {selected && tlLoading && (
                <div className="clinical-card p-8 text-center">
                  <Loader2 className="size-6 animate-spin text-muted-foreground mx-auto" />
                </div>
              )}

              {selected && !tlLoading && (
                <>
                  {/* Risk trend chart */}
                  {riskTrend.length > 1 && (
                    <div className="clinical-card p-4">
                      <h3 className="text-sm font-semibold mb-3">Risk Progression</h3>
                      <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={riskTrend}>
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                          <YAxis domain={[0, 4]} ticks={[1,2,3,4]} tickFormatter={v => ["","Low","Mod","High","Crit"][v]} tick={{ fontSize: 9 }} />
                          <Tooltip formatter={(v: any, n, p) => [p.payload.label, "Risk"]} />
                          <ReferenceLine y={3} stroke="#ef4444" strokeDasharray="3 2" />
                          <Line type="monotone" dataKey="risk" stroke="#0d9488" strokeWidth={2} dot={{ r: 4, fill: "#0d9488" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Scan timeline */}
                  <div className="clinical-card p-4">
                    <h3 className="text-sm font-semibold mb-4">Scan History</h3>
                    <div className="relative">
                      <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
                      <div className="space-y-4">
                        {timeline.scans.map((s, i) => (
                          <div key={s.id} className="flex gap-4 pl-8 relative">
                            <div className={`absolute left-1.5 size-3 rounded-full border-2 border-background mt-1 ${
                              s.risk_level === "Critical" ? "bg-destructive" :
                              s.risk_level === "High" ? "bg-amber-500" : "bg-emerald-500"
                            }`} />
                            <div className="flex-1 clinical-card p-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium italic">{s.pathogen_name || "Unknown"}</span>
                                <RiskPill level={s.risk_level || "—"} />
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Biomarker: <strong>{s.biomarker_name || "—"}</strong> · {s.scanned_by || "—"}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {new Date(s.created_at).toLocaleString()}
                                {s.case_id && (
                                  <Link to="/cases/$id" params={{ id: String(s.case_id) }} className="ml-2 text-primary hover:underline">
                                    View case →
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Cases */}
                  {timeline.cases.length > 0 && (
                    <div className="clinical-card p-4">
                      <h3 className="text-sm font-semibold mb-3">Linked Cases ({timeline.cases.length})</h3>
                      <div className="space-y-2">
                        {timeline.cases.map(c => (
                          <Link key={c.id} to="/cases/$id" params={{ id: String(c.id) }}
                            className="flex items-center justify-between p-2 rounded-md border border-border hover:bg-muted transition-colors">
                            <div>
                              <span className="text-sm font-medium">{c.title}</span>
                              <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</div>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium capitalize ${
                              c.status === "open" ? "bg-amber-50 text-amber-700 border-amber-300" : "bg-emerald-50 text-emerald-700 border-emerald-300"
                            }`}>{c.status}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
