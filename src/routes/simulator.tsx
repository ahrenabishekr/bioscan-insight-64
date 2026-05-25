import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Activity, Play, Square, AlertTriangle, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/simulator")({
  component: () => <AppShell><Page /></AppShell>,
  head: () => ({ meta: [{ title: "Sensor Simulator — ChemoSense" }] }),
});

const SENSORS = [
  { id: "dpv", name: "DPV / Colorimetric", biomarker: "Pyocyanin", unit: "µM", lod: 0.5, danger: 5, color: "#0d9488" },
  { id: "piezo", name: "Piezoelectric Aptamer", biomarker: "AIP-I (S. aureus)", unit: "nM", lod: 5, danger: 50, color: "#7c3aed" },
  { id: "fret", name: "FRET Quantum-Dot", biomarker: "3-oxo-C12-HSL", unit: "nM", lod: 1, danger: 20, color: "#0891b2" },
  { id: "aunp", name: "AuNP Lateral Flow", biomarker: "Siderophores", unit: "ng/mL", lod: 0.5, danger: 10, color: "#d97706" },
  { id: "mip", name: "MIP Capacitive", biomarker: "AIPs / Volatiles", unit: "nM", lod: 5, danger: 30, color: "#dc2626" },
];

function Page() {
  const [selected, setSelected] = useState(SENSORS[0]);
  const [running, setRunning] = useState(false);
  const [data, setData] = useState<{ t: number; signal: number; baseline: number }[]>([]);
  const [concentration, setConcentration] = useState(0);
  const [status, setStatus] = useState<"idle" | "detecting" | "positive" | "negative">("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRef = useRef(0);
  const targetConc = useRef(0);

  function startScan() {
    setData([]);
    setStatus("detecting");
    setRunning(true);
    timeRef.current = 0;
    targetConc.current = Math.random() * selected.danger * 1.5;

    intervalRef.current = setInterval(() => {
      timeRef.current += 0.5;
      const t = timeRef.current;

      // Simulate sensor response curve
      const sigmoid = (x: number) => 1 / (1 + Math.exp(-0.8 * (x - 8)));
      const noise = (Math.random() - 0.5) * 0.3;
      const signal = targetConc.current * sigmoid(t) + noise;
      const baseline = selected.lod * 0.3 + (Math.random() - 0.5) * 0.1;

      setData(prev => [...prev.slice(-40), { t: Math.round(t * 10) / 10, signal: Math.max(0, signal), baseline }]);
      setConcentration(Math.max(0, signal));

      if (t >= 15) {
        clearInterval(intervalRef.current!);
        setRunning(false);
        setStatus(targetConc.current >= selected.lod ? "positive" : "negative");
      }
    }, 200);
  }

  function stopScan() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setStatus("idle");
    setData([]);
    setConcentration(0);
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const isPositive = status === "positive";
  const isDanger = concentration >= selected.danger;

  return (
    <>
      <PageHeader title="Sensor Simulator" subtitle="Real-time electrochemical biosensor signal simulation" />
      <div className="px-6 py-6 max-w-5xl space-y-6">

        {/* Sensor selector */}
        <div className="clinical-card p-5">
          <h2 className="text-sm font-semibold mb-3">Select Biosensor Platform</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {SENSORS.map(s => (
              <button key={s.id} onClick={() => { setSelected(s); stopScan(); }}
                className={`p-3 rounded-md border text-left transition-all ${selected.id === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                <div className="text-xs font-semibold">{s.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{s.biomarker}</div>
                <div className="text-[11px] text-muted-foreground">LOD: {s.lod} {s.unit}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Live signal graph */}
        <div className="clinical-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                Live Signal — {selected.name}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Target: {selected.biomarker}</p>
            </div>
            <div className="flex gap-2">
              {!running ? (
                <button onClick={startScan}
                  className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5">
                  <Play className="size-3.5" /> Run Scan
                </button>
              ) : (
                <button onClick={stopScan}
                  className="h-9 px-4 rounded-md bg-destructive text-white text-xs font-medium inline-flex items-center gap-1.5">
                  <Square className="size-3.5" /> Stop
                </button>
              )}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="t" label={{ value: "Time (s)", position: "insideBottom", offset: -2 }} tick={{ fontSize: 10 }} />
              <YAxis label={{ value: `Conc. (${selected.unit})`, angle: -90, position: "insideLeft" }} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => [`${v.toFixed(2)} ${selected.unit}`, ""]} />
              <ReferenceLine y={selected.lod} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: `LOD ${selected.lod}`, fill: "#f59e0b", fontSize: 10 }} />
              <ReferenceLine y={selected.danger} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `Danger ${selected.danger}`, fill: "#ef4444", fontSize: 10 }} />
              <Line type="monotone" dataKey="baseline" stroke="#94a3b8" strokeWidth={1} dot={false} name="Baseline" />
              <Line type="monotone" dataKey="signal" stroke={selected.color} strokeWidth={2.5} dot={false} name="Signal" animationDuration={0} />
            </LineChart>
          </ResponsiveContainer>

          {/* Live readout */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-muted rounded-md p-3 text-center">
              <div className="text-xs text-muted-foreground">Current Signal</div>
              <div className="text-xl font-bold font-mono mt-1" style={{ color: selected.color }}>
                {concentration.toFixed(2)}
              </div>
              <div className="text-[10px] text-muted-foreground">{selected.unit}</div>
            </div>
            <div className="bg-muted rounded-md p-3 text-center">
              <div className="text-xs text-muted-foreground">LOD Threshold</div>
              <div className="text-xl font-bold font-mono mt-1 text-amber-500">{selected.lod}</div>
              <div className="text-[10px] text-muted-foreground">{selected.unit}</div>
            </div>
            <div className="bg-muted rounded-md p-3 text-center">
              <div className="text-xs text-muted-foreground">Status</div>
              <div className={`text-sm font-bold mt-1 ${isDanger ? "text-destructive" : concentration >= selected.lod ? "text-amber-500" : "text-emerald-500"}`}>
                {status === "idle" ? "Ready" : status === "detecting" ? "Scanning..." : isPositive ? "DETECTED" : "NEGATIVE"}
              </div>
            </div>
          </div>
        </div>

        {/* Result card */}
        {(status === "positive" || status === "negative") && (
          <div className={`clinical-card p-5 border-2 ${isPositive ? "border-destructive/30 bg-destructive/5" : "border-emerald-300 bg-emerald-50"}`}>
            <div className="flex items-center gap-3">
              {isPositive ? <AlertTriangle className="size-6 text-destructive" /> : <CheckCircle className="size-6 text-emerald-600" />}
              <div>
                <div className={`font-semibold ${isPositive ? "text-destructive" : "text-emerald-700"}`}>
                  {isPositive ? `${selected.biomarker} DETECTED` : "No Detection"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {isPositive
                    ? `Concentration ${concentration.toFixed(2)} ${selected.unit} exceeds LOD of ${selected.lod} ${selected.unit}. Immediate clinical action recommended.`
                    : `Signal below LOD threshold. No significant biomarker presence detected.`}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
