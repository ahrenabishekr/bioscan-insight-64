import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill } from "@/components/AppShell";
import React, { useEffect, useState, useRef } from "react";
import { Cpu, Activity, Zap, AlertTriangle, CheckCircle, RefreshCw, Plus, Wrench, X } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { apiFetch } from "@/lib/apiClient";

const API_URL = "https://chemosense-backend.onrender.com/api";

export const Route = createFileRoute("/sensors")({
  component: () => <AppShell><Page /></AppShell>,
  head: () => ({ meta: [{ title: "Sensors — ChemoSense" }] }),
});

function Page() {
  const [sensors, setSensors] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [readings, setReadings] = useState<any[]>([]);
  const [simValue, setSimValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [autoSim, setAutoSim] = useState(false);
  const [liveStream, setLiveStream] = useState(false);
  const eventSourceRef = React.useRef<EventSource | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newSensor, setNewSensor] = useState({ name: "", type: "Electrochemical", location: "", description: "" });
  const [adding, setAdding] = useState(false);
  const autoRef = useRef<any>(null);

  useEffect(() => {
    loadSensors();
  }, []);

  useEffect(() => {
    if (selected) {
      loadReadings(selected.id);
      // Close any existing stream
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      setLiveStream(false);
    }
  }, [selected?.id]);

  useEffect(() => {
    if (autoSim && selected) {
      autoRef.current = setInterval(() => {
        const base = selected.last_reading || 10;
        const noise = (Math.random() - 0.3) * 15;
        const val = Math.max(0, +(base + noise).toFixed(2));
        sendReading(val);
      }, 2000);
    } else {
      clearInterval(autoRef.current);
    }
    return () => clearInterval(autoRef.current);
  }, [autoSim, selected]);

  async function addSensor() {
    if (!newSensor.name) return;
    setAdding(true);
    try {
      await apiFetch(`${API_URL}/sensors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newSensor, status: "active" }),
      });
      setShowAdd(false);
      setNewSensor({ name: "", type: "Electrochemical", location: "", description: "" });
      await loadSensors();
    } finally { setAdding(false); }
  }

  async function loadSensors() {
    setLoading(true);
    try {
      const r = await apiFetch(`${API_URL}/sensors`);
      const data = await r.json();
      setSensors(Array.isArray(data) ? data : []);
      if (data.length > 0) setSelected(data[0]);
    } finally { setLoading(false); }
  }

  async function loadReadings(id: number) {
    const r = await apiFetch(`${API_URL}/sensors/${id}/readings`);
    const data = await r.json();
    setReadings(Array.isArray(data) ? data.reverse() : []);
  }

  async function sendReading(val?: number) {
    const value = val ?? parseFloat(simValue);
    if (isNaN(value) || !selected) return;
    setSimulating(true);
    try {
      const r = await apiFetch(`${API_URL}/sensors/${selected.id}/reading`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reading: value, unit: selected.reading_unit || "nM" }),
      });
      const data = await r.json();
      const newReading = {
        reading: value,
        created_at: new Date().toISOString(),
        qs_activated: data.qs_activated,
        lod_crossed: data.lod_crossed,
        signal_strength: data.signal_strength,
      };
      setReadings(prev => [...prev, newReading]);
      setSelected((s: any) => ({ ...s, last_reading: value }));
      if (!val) setSimValue("");
    } finally { setSimulating(false); }
  }

  function toggleLiveStream() {
    if (liveStream) {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      setLiveStream(false);
    } else {
      if (!selected) return;
      const sid = getSession()?.student_id || "";
      const es = new EventSource(`${API_URL}/sensors/${selected.id}/live?student_id=${encodeURIComponent(sid)}`);
      es.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setReadings(prev => [...prev.slice(-49), { ...data, created_at: data.timestamp }]);
        setSelected((s: any) => ({ ...s, last_reading: data.reading }));
      };
      es.onerror = () => { es.close(); setLiveStream(false); };
      eventSourceRef.current = es;
      setLiveStream(true);
    }
  }

  async function calibrate() {
    if (!selected) return;
    await apiFetch(`${API_URL}/sensors/${selected.id}/calibrate`, { method: "PATCH" });
    setSelected((s: any) => ({ ...s, last_calibrated: new Date().toISOString(), calibration_drift: 0 }));
    alert("Sensor calibrated ✅");
  }

  const lastReading = readings[readings.length - 1];
  const lodThreshold = selected?.lod_threshold ?? 10;
  const qsThreshold = selected?.qs_threshold ?? 50;
  const signalPct = lastReading ? Math.min(100, Math.round((lastReading.reading / qsThreshold) * 100)) : 0;

  return (
    <>
      <PageHeader title="Sensors" subtitle="Live chemosensor readings & QS threshold monitoring"
        actions={
          <button onClick={() => setShowAdd(true)} className="h-9 px-3 text-xs rounded-md bg-primary text-primary-foreground inline-flex items-center gap-1.5">
            <Plus className="size-3.5" /> Add sensor
          </button>
        }
      />
      <div className="px-6 py-6 max-w-6xl">
        {loading && <p className="text-sm text-muted-foreground">Loading sensors…</p>}

        {!loading && sensors.length === 0 && (
          <div className="clinical-card p-8 text-center">
            <Cpu className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No sensors yet.</p>
          </div>
        )}

        {sensors.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sensor list */}
            <div className="space-y-2">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Sensors</h2>
              {sensors.map(s => (
                <button key={s.id} onClick={() => setSelected(s)}
                  className={`w-full text-left clinical-card p-3 transition-all ${selected?.id === s.id ? "border-primary" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{s.name}</span>
                    <span className={`size-2 rounded-full ${s.status === "active" ? "bg-emerald-500" : s.status === "maintenance" ? "bg-amber-500" : "bg-slate-300"}`} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{s.type || "General"} · {s.location || "—"}</div>
                  {s.last_reading != null && (
                    <div className="text-xs font-mono mt-1 text-primary">{s.last_reading} {s.reading_unit || "nM"}</div>
                  )}
                </button>
              ))}
            </div>

            {/* Live panel */}
            {selected && (
              <div className="lg:col-span-2 space-y-4">
                {/* Status cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="clinical-card p-3 text-center">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Signal</div>
                    <div className={`text-2xl font-bold mt-1 ${signalPct >= 100 ? "text-destructive" : signalPct >= 60 ? "text-amber-500" : "text-emerald-500"}`}>
                      {signalPct}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">of QS threshold</div>
                  </div>
                  <div className="clinical-card p-3 text-center">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Reading</div>
                    <div className="text-2xl font-bold mt-1 font-mono">
                      {selected.last_reading ?? "—"}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{selected.reading_unit || "nM"}</div>
                  </div>
                  <div className="clinical-card p-3 text-center">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</div>
                    <div className="mt-1">
                      {lastReading?.qs_activated ? (
                        <div className="flex flex-col items-center gap-1">
                          <AlertTriangle className="size-6 text-destructive" />
                          <span className="text-[10px] text-destructive font-bold">QS ACTIVE</span>
                        </div>
                      ) : lastReading?.lod_crossed ? (
                        <div className="flex flex-col items-center gap-1">
                          <Zap className="size-6 text-amber-500" />
                          <span className="text-[10px] text-amber-600 font-bold">LOD CROSSED</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <CheckCircle className="size-6 text-emerald-500" />
                          <span className="text-[10px] text-emerald-600 font-bold">NORMAL</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* QS Warning */}
                {lastReading?.qs_activated === 1 && (
                  <div className="clinical-card p-4 border-l-4 border-l-destructive bg-destructive/5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-4 text-destructive shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-destructive">Quorum Sensing Threshold Exceeded</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Bacterial density has crossed the QS activation point. Biofilm formation and virulence factor production are likely imminent. Immediate clinical review required.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chart */}
                <div className="clinical-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Live Signal Trace</h3>
                    <button onClick={() => loadReadings(selected.id)} className="size-7 grid place-items-center text-muted-foreground hover:text-foreground rounded border border-border">
                      <RefreshCw className="size-3.5" />
                    </button>
                  </div>
                  {readings.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={readings.map((r, i) => ({ i: i + 1, value: +r.reading, time: new Date(r.created_at).toLocaleTimeString() }))}>
                        <XAxis dataKey="i" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: any) => [`${v} nM`, "Reading"]} labelFormatter={(l) => readings[l - 1] ? new Date(readings[l - 1].created_at).toLocaleTimeString() : ""} />
                        <ReferenceLine y={lodThreshold} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: "LOD", fontSize: 9, fill: "#f59e0b" }} />
                        <ReferenceLine y={qsThreshold} stroke="#ef4444" strokeDasharray="4 2" label={{ value: "QS", fontSize: 9, fill: "#ef4444" }} />
                        <Line type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-8">No readings yet. Simulate a reading below.</p>
                  )}
                </div>

                {/* Simulate reading */}
                <div className="clinical-card p-4">
                  <h3 className="text-sm font-semibold mb-3">Inject Reading</h3>
                  <div className="flex gap-2 flex-wrap">
                    <input value={simValue} onChange={e => setSimValue(e.target.value)} type="number"
                      placeholder={`Value in ${selected.reading_unit || "nM"}`}
                      className="flex-1 min-w-32 h-9 px-3 text-sm border border-input rounded-md bg-background" />
                    <button onClick={() => sendReading()} disabled={simulating || !simValue}
                      className="h-9 px-4 text-xs rounded-md bg-primary text-primary-foreground inline-flex items-center gap-1.5 disabled:opacity-50">
                      <Activity className="size-3.5" /> Send
                    </button>
                    <button onClick={toggleLiveStream}
                      className={`h-9 px-4 text-xs rounded-md border inline-flex items-center gap-1.5 ${liveStream ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "border-border text-muted-foreground"}`}>
                      {liveStream ? <><span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Live ON</> : <>▶ Start Live</>}
                    </button>
                    <button onClick={calibrate}
                      className="h-9 px-3 text-xs rounded-md border border-border inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                      <Wrench className="size-3.5" /> Calibrate
                    </button>
                  </div>
                  <div className="mt-2 text-[10px] text-muted-foreground">
                    LOD: <span className="font-mono text-amber-600">{lodThreshold} nM</span> · 
                    QS threshold: <span className="font-mono text-destructive">{qsThreshold} nM</span> · 
                    Last calibrated: {selected.last_calibrated ? new Date(selected.last_calibrated).toLocaleDateString() : "—"}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Add sensor modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="clinical-card p-6 w-full max-w-md bg-background">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Add New Sensor</h2>
              <button onClick={() => setShowAdd(false)} className="size-7 grid place-items-center text-muted-foreground hover:text-foreground rounded border border-border">
                <X className="size-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-medium">Sensor name *</span>
                <input value={newSensor.name} onChange={e => setNewSensor(s => ({ ...s, name: e.target.value }))}
                  placeholder="e.g. Electrochemical Sensor D4"
                  className="mt-1 w-full h-10 border border-input rounded-md px-3 text-sm bg-background" />
              </label>
              <label className="block">
                <span className="text-xs font-medium">Type</span>
                <select value={newSensor.type} onChange={e => setNewSensor(s => ({ ...s, type: e.target.value }))}
                  className="mt-1 w-full h-10 border border-input rounded-md px-3 text-sm bg-background">
                  {["Electrochemical", "Optical", "Piezoelectric", "Fluorescence", "Mass spectrometry"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium">Location</span>
                <input value={newSensor.location} onChange={e => setNewSensor(s => ({ ...s, location: e.target.value }))}
                  placeholder="e.g. Lab Room 4"
                  className="mt-1 w-full h-10 border border-input rounded-md px-3 text-sm bg-background" />
              </label>
              <label className="block">
                <span className="text-xs font-medium">Description</span>
                <input value={newSensor.description} onChange={e => setNewSensor(s => ({ ...s, description: e.target.value }))}
                  placeholder="e.g. Detects Pyocyanin via redox"
                  className="mt-1 w-full h-10 border border-input rounded-md px-3 text-sm bg-background" />
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={addSensor} disabled={adding || !newSensor.name}
                className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                {adding ? "Adding…" : "Add Sensor"}
              </button>
              <button onClick={() => setShowAdd(false)}
                className="h-10 px-4 rounded-md border border-border text-sm text-muted-foreground hover:bg-muted">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
