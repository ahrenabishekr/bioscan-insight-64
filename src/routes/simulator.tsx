import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill } from "@/components/AppShell";
import { useState, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Activity, Play, Square, AlertTriangle, CheckCircle, FlaskConical, ArrowRight, Loader2, Bell } from "lucide-react";
import { getSession } from "@/lib/auth";
import { apiFetch } from "@/lib/apiClient";

const API_URL = "https://chemosense-backend.onrender.com/api";

export const Route = createFileRoute("/simulator")({
  component: () => <AppShell><Page /></AppShell>,
  head: () => ({ meta: [{ title: "Sensor Simulator — ChemoSense" }] }),
});

const SENSORS = [
  { id: "dpv", name: "DPV / Colorimetric", biomarker: "Pyocyanin", unit: "µM", lod: 0.5, danger: 5, color: "#0d9488" },
  { id: "piezo", name: "Piezoelectric Aptamer", biomarker: "AIP-I", unit: "nM", lod: 5, danger: 50, color: "#7c3aed" },
  { id: "fret", name: "FRET Quantum-Dot", biomarker: "3-oxo-C12-HSL", unit: "nM", lod: 1, danger: 20, color: "#0891b2" },
  { id: "aunp", name: "AuNP Lateral Flow", biomarker: "Siderophores", unit: "ng/mL", lod: 0.5, danger: 10, color: "#d97706" },
  { id: "mip", name: "MIP Capacitive", biomarker: "AIP-II", unit: "nM", lod: 5, danger: 30, color: "#dc2626" },
];

function Page() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(SENSORS[0]);
  const [running, setRunning] = useState(false);
  const [data, setData] = useState([]);
  const [concentration, setConcentration] = useState(0);
  const [status, setStatus] = useState("idle");
  const [matches, setMatches] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [caseId, setCaseId] = useState(null);
  const intervalRef = useRef(null);
  const timeRef = useRef(0);
  const targetConc = useRef(0);
  const lodCrossedRef = useRef(false);

  function selectSensor(s) {
    stopScan();
    setSelected(s);
    setData([]);
    setConcentration(0);
    setStatus("idle");
    setMatches([]);
    setCaseId(null);
    lodCrossedRef.current = false;
  }

  async function runBiomarkerMatch(biomarker) {
    setMatchLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/scan/biomarker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ biomarker }),
      });
      const d = await res.json();
      setMatches(Array.isArray(d) ? d : (d.results || []));
    } catch (err) {
      console.error("Biomarker match failed:", err);
    } finally {
      setMatchLoading(false);
    }
  }

  function startScan() {
    setData([]);
    setMatches([]);
    setCaseId(null);
    setStatus("detecting");
    lodCrossedRef.current = false;
    timeRef.current = 0;
    targetConc.current = selected.lod * (2 + Math.random() * 8);
    intervalRef.current = setInterval(() => {
      timeRef.current += 0.5;
      const t = timeRef.current;
      const progress = Math.min(1, t / 30);
      const signal = targetConc.current * progress + (Math.random() - 0.5) * selected.lod * 0.3;
      const baseline = (Math.random() - 0.5) * selected.lod * 0.1;
      setConcentration(+Math.max(0, signal).toFixed(3));
      setData(prev => [...prev.slice(-60), { t: +t.toFixed(1), signal: +signal.toFixed(3), baseline: +baseline.toFixed(3) }]);
      if (signal >= selected.lod && !lodCrossedRef.current) {
        lodCrossedRef.current = true;
        setStatus("positive");
        runBiomarkerMatch(selected.biomarker);
      }
      if (t >= 35) { stopScan(); if (!lodCrossedRef.current) setStatus("negative"); }
    }, 200);
    setRunning(true);
  }

  function stopScan() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  }

  async function createCaseAndAlert() {
    if (matches.length === 0) return;
    const u = getSession();
    setSaving(true);
    try {
      const top = matches[0];
      const res = await apiFetch(`${API_URL}/scans/full`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: `SIM-${Date.now().toString(36).toUpperCase()}`,
          pathogen_name: top.pathogen.name,
          biomarker_name: selected.biomarker,
          risk_level: top.pathogen.riskLevel,
          scanned_by: u?.name ?? "Simulator",
          result: "positive",
          notes: `Simulated ${selected.name} detection. Concentration: ${concentration} ${selected.unit}`,
          value: concentration,
          unit: selected.unit,
        }),
      });
      const d = await res.json();
      if (d.case_id) setCaseId(d.case_id);
    } finally { setSaving(false); }
  }

  return (
    <>
      <PageHeader title="Sensor Simulator"
        subtitle="Real-time electrochemical biosensor signal simulation — detects biomarker and triggers clinical workflow" />
      <div className="px-6 py-6 max-w-5xl space-y-5">
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Select Biosensor Platform</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {SENSORS.map(s => (
              <button key={s.id} onClick={() => selectSensor(s)}
                className={"clinical-card p-3 text-left transition-all " + (selected.id === s.id ? "border-primary ring-1 ring-primary" : "hover:border-muted-foreground")}>
                <div className="text-xs font-semibold">{s.name}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{s.biomarker}</div>
                <div className="text-[10px] font-mono mt-0.5" style={{ color: s.color }}>LOD: {s.lod} {s.unit}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="clinical-card p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Activity className="size-4" style={{ color: selected.color }} />
              <div>
                <div className="text-sm font-semibold">Live Signal — {selected.name}</div>
                <div className="text-xs text-muted-foreground">Target biomarker: {selected.biomarker}</div>
              </div>
            </div>
            <button onClick={running ? stopScan : startScan}
              className={"h-9 px-4 text-xs rounded-md font-medium inline-flex items-center gap-2 " + (running ? "bg-destructive text-white" : "bg-primary text-primary-foreground")}>
              {running ? <><Square className="size-3.5" /> Stop</> : <><Play className="size-3.5" /> Run Scan</>}
            </button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="t" tick={{ fontSize: 9 }} label={{ value: "Time (s)", position: "insideBottom", offset: -2, fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip formatter={(v, n) => [`${v} ${selected.unit}`, n === "signal" ? "Signal" : "Baseline"]} />
              <ReferenceLine y={selected.lod} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: `LOD: ${selected.lod}`, fontSize: 9, fill: "#f59e0b", position: "right" }} />
              <ReferenceLine y={selected.danger} stroke="#ef4444" strokeDasharray="4 2" label={{ value: "Danger", fontSize: 9, fill: "#ef4444", position: "right" }} />
              <Line type="monotone" dataKey="signal" stroke={selected.color} strokeWidth={2} dot={false} name="signal" />
              <Line type="monotone" dataKey="baseline" stroke="#94a3b8" strokeWidth={1} dot={false} strokeDasharray="2 2" name="baseline" />
            </LineChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-[10px] text-muted-foreground">Current Signal</div>
              <div className="text-xl font-bold font-mono" style={{ color: selected.color }}>{concentration.toFixed(2)}</div>
              <div className="text-[10px] text-muted-foreground">{selected.unit}</div>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-[10px] text-muted-foreground">LOD Threshold</div>
              <div className="text-xl font-bold font-mono text-amber-500">{selected.lod}</div>
              <div className="text-[10px] text-muted-foreground">{selected.unit}</div>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-[10px] text-muted-foreground">Status</div>
              <div className="mt-1">
                {status === "idle" && <span className="text-xs text-muted-foreground">Ready</span>}
                {status === "detecting" && <span className="text-xs text-amber-600 font-medium flex items-center justify-center gap-1"><Loader2 className="size-3 animate-spin" /> Detecting…</span>}
                {status === "positive" && <span className="text-xs text-destructive font-bold flex items-center justify-center gap-1"><AlertTriangle className="size-3" /> LOD CROSSED</span>}
                {status === "negative" && <span className="text-xs text-emerald-600 font-medium flex items-center justify-center gap-1"><CheckCircle className="size-3" /> Not Detected</span>}
              </div>
            </div>
          </div>
        </div>

        {status === "positive" && (
          <div className="clinical-card p-5 border-l-4 border-l-destructive">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="size-4 text-destructive" />
              <span className="text-sm font-bold text-destructive">{selected.biomarker} DETECTED</span>
              <span className="text-xs text-muted-foreground">— Concentration {concentration.toFixed(2)} {selected.unit} exceeds LOD of {selected.lod} {selected.unit}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Immediate clinical action recommended. Identify pathogen and create case report.</p>

            {matchLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="size-4 animate-spin" /> Matching biomarker to pathogen database…
              </div>
            )}

            {!matchLoading && matches.length > 0 && (
              <>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Likely Pathogens</h3>
                <div className="space-y-2 mb-4">
                  {matches.map((r) => (
                    <div key={r.pathogen.id} className={"rounded-lg border p-3 border-l-4 " + (r.pathogen.riskLevel === "Critical" ? "border-l-destructive" : r.pathogen.riskLevel === "High" ? "border-l-amber-400" : "border-l-blue-400")}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold italic">{r.pathogen.name}</span>
                        <RiskPill level={r.pathogen.riskLevel} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{r.pathogen.summary}</div>
                      <div className="text-xs mt-1"><span className="font-medium">Treatment: </span>{r.pathogen.empiricalTreatment?.slice(0,2).join(" · ")}</div>
                    </div>
                  ))}
                </div>

                {caseId ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <CheckCircle className="size-4 text-emerald-600 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-emerald-700">Case #{caseId} created · Alert sent to doctors</p>
                      <p className="text-xs text-muted-foreground">Scan saved to database with pathogen match and biomarker reading.</p>
                    </div>
                    <button onClick={() => navigate({ to: "/cases/$id", params: { id: String(caseId) } })}
                      className="h-8 px-3 text-xs rounded-md bg-emerald-600 text-white inline-flex items-center gap-1.5">
                      View Case <ArrowRight className="size-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={createCaseAndAlert} disabled={saving}
                      className="h-10 px-4 text-xs rounded-md bg-destructive text-white font-medium inline-flex items-center gap-2 disabled:opacity-60">
                      {saving ? <><Loader2 className="size-3.5 animate-spin" /> Creating…</> : <><Bell className="size-3.5" /> Create Case & Alert Doctors</>}
                    </button>
                    <button onClick={() => navigate({ to: "/scan" })}
                      className="h-10 px-4 text-xs rounded-md border border-border inline-flex items-center gap-2 text-muted-foreground hover:bg-muted">
                      <FlaskConical className="size-3.5" /> Run Full Clinical Scan
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {status === "negative" && (
          <div className="clinical-card p-4 flex items-center gap-3 bg-emerald-50/50 border-emerald-200">
            <CheckCircle className="size-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-700">No biomarker detected above LOD</p>
              <p className="text-xs text-muted-foreground">Signal remained below {selected.lod} {selected.unit}. Consider retesting or using a different sensor platform.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
