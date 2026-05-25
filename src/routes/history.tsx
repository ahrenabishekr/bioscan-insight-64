import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus, Activity, AlertTriangle } from "lucide-react";

const API_URL = "https://chemosense-backend-production.up.railway.app/api";

export const Route = createFileRoute("/history")({
  component: () => <AppShell><Page /></AppShell>,
  head: () => ({ meta: [{ title: "Scan History — ChemoSense" }] }),
});

function Page() {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState("");
  const [filtered, setFiltered] = useState<any[]>([]);
  const [patients, setPatients] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/scans`)
      .then(r => r.json())
      .then(data => {
        setScans(data);
        const unique = [...new Set(data.map((s: any) => s.patient_id).filter(Boolean))] as string[];
        setPatients(unique);
        setFiltered(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!patientId) {
      setFiltered(scans);
    } else {
      setFiltered(scans.filter(s => s.patient_id === patientId));
    }
  }, [patientId, scans]);

  // Build trend data for chart
  const trendData = filtered
    .filter(s => s.value)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((s, i) => ({
      index: i + 1,
      date: new Date(s.created_at).toLocaleDateString(),
      value: parseFloat(s.value),
      biomarker: s.biomarker_name,
      pathogen: s.pathogen_name,
    }));

  // Trend direction
  function getTrend() {
    if (trendData.length < 2) return "stable";
    const first = trendData[0].value;
    const last = trendData[trendData.length - 1].value;
    if (last > first * 1.1) return "up";
    if (last < first * 0.9) return "down";
    return "stable";
  }

  const trend = getTrend();

  return (
    <>
      <PageHeader
        title="Scan History & Trends"
        subtitle="Track biomarker levels over time per patient"
      />

      <div className="space-y-6 p-4">

        {/* Patient Filter */}
        <div className="clinical-card p-4">
          <label className="block text-sm font-medium mb-2">Filter by Patient ID</label>
          <div className="flex gap-3">
            <select
              className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background"
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
            >
              <option value="">All Patients</option>
              {patients.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {patientId && (
              <button
                onClick={() => setPatientId("")}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-muted"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="clinical-card p-4 text-center">
            <div className="text-2xl font-bold text-primary">{filtered.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Scans</div>
          </div>
          <div className="clinical-card p-4 text-center">
            <div className="text-2xl font-bold text-destructive">
              {filtered.filter(s => s.risk_level === "Critical" || s.risk_level === "High").length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">High Risk</div>
          </div>
          <div className="clinical-card p-4 text-center">
            <div className="flex justify-center mb-1">
              {trend === "up" && <TrendingUp className="size-6 text-destructive" />}
              {trend === "down" && <TrendingDown className="size-6 text-emerald-500" />}
              {trend === "stable" && <Minus className="size-6 text-amber-500" />}
            </div>
            <div className="text-xs text-muted-foreground">Biomarker Trend</div>
          </div>
        </div>

        {/* Trend Chart */}
        {trendData.length > 1 && (
          <div className="clinical-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="size-4 text-primary" />
              <h3 className="font-semibold text-sm">Biomarker Concentration Over Time</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 text-xs shadow-lg">
                          <div className="font-semibold">{d.date}</div>
                          <div>Value: <span className="text-primary font-bold">{d.value}</span></div>
                          <div>Biomarker: {d.biomarker}</div>
                          <div>Pathogen: {d.pathogen}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            {trend === "up" && (
              <div className="flex items-center gap-2 mt-3 text-xs text-destructive bg-destructive/10 p-2 rounded-lg">
                <AlertTriangle className="size-3" />
                Biomarker levels are increasing — consider immediate clinical review
              </div>
            )}
          </div>
        )}

        {/* Scan List */}
        <div className="clinical-card p-4">
          <h3 className="font-semibold text-sm mb-3">Scan Records</h3>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No scans found</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((scan, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg text-sm hover:bg-muted/50">
                  <div>
                    <div className="font-medium">{scan.pathogen_name || "Unknown Pathogen"}</div>
                    <div className="text-xs text-muted-foreground">
                      {scan.biomarker_name} · Patient: {scan.patient_id || "N/A"} · {new Date(scan.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {scan.value && <span className="text-xs font-mono text-primary">{scan.value} {scan.unit}</span>}
                    <RiskPill level={scan.risk_level} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
