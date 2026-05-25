import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill } from "@/components/AppShell";
import { pathogens } from "@/data/pathogens";
import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, Legend
} from "recharts";
import { AlertTriangle, FlaskConical, MapPin, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  component: () => <AppShell><Page /></AppShell>,
  head: () => ({ meta: [{ title: "Analytics — ChemoSense" }] }),
});

// ── 1. Infection Risk Timeline data ─────────────────────────
function getRiskTimeline(pathogenId: string) {
  const spreads: Record<string, { hour: number; load: number; stage: string }[]> = {
    pa: [
      { hour: 0, load: 1, stage: "Colonisation" },
      { hour: 6, load: 8, stage: "Biofilm Init" },
      { hour: 12, load: 40, stage: "QS Active" },
      { hour: 24, load: 150, stage: "Virulence" },
      { hour: 48, load: 600, stage: "Sepsis Risk" },
      { hour: 72, load: 2000, stage: "Critical" },
    ],
    sa: [
      { hour: 0, load: 1, stage: "Colonisation" },
      { hour: 4, load: 20, stage: "Toxin Release" },
      { hour: 8, load: 100, stage: "Tissue Damage" },
      { hour: 24, load: 800, stage: "Sepsis Risk" },
      { hour: 48, load: 3000, stage: "Critical" },
      { hour: 72, load: 8000, stage: "Septic Shock" },
    ],
    kp: [
      { hour: 0, load: 1, stage: "Colonisation" },
      { hour: 8, load: 15, stage: "Capsule Form" },
      { hour: 16, load: 80, stage: "Invasion" },
      { hour: 32, load: 400, stage: "Bacteraemia" },
      { hour: 56, load: 1500, stage: "Sepsis Risk" },
      { hour: 72, load: 4000, stage: "Critical" },
    ],
    ec: [
      { hour: 0, load: 1, stage: "Colonisation" },
      { hour: 6, load: 12, stage: "Biofilm" },
      { hour: 18, load: 90, stage: "Toxin" },
      { hour: 36, load: 500, stage: "Sepsis Risk" },
      { hour: 60, load: 2500, stage: "Critical" },
      { hour: 72, load: 5000, stage: "Septic Shock" },
    ],
    ab: [
      { hour: 0, load: 1, stage: "Colonisation" },
      { hour: 5, load: 25, stage: "Rapid Growth" },
      { hour: 10, load: 200, stage: "Invasion" },
      { hour: 20, load: 1000, stage: "Virulence" },
      { hour: 40, load: 5000, stage: "Sepsis Risk" },
      { hour: 72, load: 15000, stage: "Critical" },
    ],
  };
  return spreads[pathogenId] || spreads["pa"];
}

// ── 2. Infection site heatmap data ──────────────────────────
const SITES = ["Wound", "Lung", "UTI", "Bloodstream", "Catheter", "Bone", "CNS"];

function buildHeatmap() {
  return SITES.map(site => {
    const row: Record<string, any> = { site };
    pathogens.forEach(p => {
      const match = p.infectionSites.some(s =>
        s.toLowerCase().includes(site.toLowerCase()) ||
        (site === "Wound" && s.toLowerCase().includes("wound")) ||
        (site === "Lung" && (s.toLowerCase().includes("lung") || s.toLowerCase().includes("cf") || s.toLowerCase().includes("vap") || s.toLowerCase().includes("pneum"))) ||
        (site === "UTI" && s.toLowerCase().includes("uti")) ||
        (site === "Bloodstream" && (s.toLowerCase().includes("blood") || s.toLowerCase().includes("bacter") || s.toLowerCase().includes("sepsis"))) ||
        (site === "Catheter" && s.toLowerCase().includes("catheter")) ||
        (site === "Bone" && (s.toLowerCase().includes("bone") || s.toLowerCase().includes("osteo"))) ||
        (site === "CNS" && (s.toLowerCase().includes("cns") || s.toLowerCase().includes("menin")))
      );
      row[p.shortName] = match ? (p.riskLevel === "Critical" ? 3 : p.riskLevel === "High" ? 2 : 1) : 0;
    });
    return row;
  });
}

const RISK_COLORS: Record<number, string> = {
  0: "#f1f5f9",
  1: "#fef08a",
  2: "#fb923c",
  3: "#ef4444",
};

const PATHOGEN_COLORS = ["#0d9488", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6"];

function Page() {
  const [selectedPathogen, setSelectedPathogen] = useState(pathogens[0]);
  const [lod, setLod] = useState("");
  const [concentration, setConcentration] = useState("");
  const [calcResult, setCalcResult] = useState<null | { crossed: boolean; ratio: number; message: string }>(null);

  const timeline = getRiskTimeline(selectedPathogen.id);
  const heatmap = buildHeatmap();

  // Radar data for pathogen risk profile
  const radarData = pathogens.map(p => ({
    pathogen: p.shortName,
    biomarkers: p.biomarkers.length,
    sites: p.infectionSites.length,
    amr: p.amrGenes.length,
    risk: p.riskLevel === "Critical" ? 4 : p.riskLevel === "High" ? 3 : p.riskLevel === "Moderate" ? 2 : 1,
  }));

  function calculate() {
    const l = parseFloat(lod);
    const c = parseFloat(concentration);
    if (isNaN(l) || isNaN(c) || l <= 0) {
      setCalcResult(null);
      return;
    }
    const ratio = c / l;
    const crossed = ratio >= 1;
    setCalcResult({
      crossed,
      ratio,
      message: crossed
        ? `Infection threshold CROSSED (${ratio.toFixed(2)}× LOD). Immediate clinical action recommended.`
        : `Below threshold (${ratio.toFixed(2)}× LOD). Monitor patient — consider repeat scan in 6h.`,
    });
  }

  return (
    <>
      <PageHeader title="Clinical Analytics" subtitle="Infection timeline, heatmap & biomarker calculator" />

      <div className="space-y-6 p-4">

        {/* ── 1. Infection Risk Timeline ─────────────── */}
        <div className="clinical-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="size-4 text-destructive" />
            <h3 className="font-semibold text-sm">Infection Risk Timeline (if untreated)</h3>
          </div>

          <div className="flex gap-2 flex-wrap mb-4">
            {pathogens.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPathogen(p)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  selectedPathogen.id === p.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted"
                }`}
              >
                {p.shortName}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-3">
            <RiskPill level={selectedPathogen.riskLevel} />
            <span className="text-xs text-muted-foreground">
              Without treatment, bacterial load escalates exponentially
            </span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" label={{ value: "Hours", position: "insideBottom", offset: -2, fontSize: 10 }} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} label={{ value: "Bacterial Load", angle: -90, position: "insideLeft", fontSize: 10 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 text-xs shadow-lg">
                        <div className="font-semibold text-destructive">{d.stage}</div>
                        <div>Hour {d.hour}: Load {d.load.toLocaleString()}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="load" stroke="#ef4444" strokeWidth={2} dot={{ r: 5, fill: "#ef4444" }} />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {timeline.slice(1).map((t, i) => (
              <div key={i} className={`text-xs p-2 rounded-lg text-center ${
                t.load > 1000 ? "bg-destructive/10 text-destructive" :
                t.load > 100 ? "bg-amber-50 text-amber-700" :
                "bg-emerald-50 text-emerald-700"
              }`}>
                <div className="font-semibold">{t.stage}</div>
                <div className="text-[10px]">{t.hour}h</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 2. Biomarker Concentration Calculator ──── */}
        <div className="clinical-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical className="size-4 text-primary" />
            <h3 className="font-semibold text-sm">Biomarker Concentration Calculator</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium block mb-1">LOD (Limit of Detection)</label>
              <input
                type="number"
                placeholder="e.g. 0.5"
                value={lod}
                onChange={e => setLod(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Sample Concentration</label>
              <input
                type="number"
                placeholder="e.g. 1.2"
                value={concentration}
                onChange={e => setConcentration(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
              />
            </div>
          </div>

          {/* Quick fill from pathogens */}
          <div className="mb-3">
            <div className="text-xs text-muted-foreground mb-2">Quick fill from library:</div>
            <div className="flex gap-2 flex-wrap">
              {pathogens.flatMap(p => p.biomarkers.map(b => ({
                name: b.name,
                lod: parseFloat(b.lod),
                pathogen: p.shortName,
              }))).slice(0, 6).map((b, i) => (
                <button
                  key={i}
                  onClick={() => setLod(b.lod.toString())}
                  className="text-[10px] px-2 py-1 border rounded-full hover:bg-muted"
                >
                  {b.name} ({b.lod})
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={calculate}
            className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            Calculate Threshold
          </button>

          {calcResult && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              calcResult.crossed ? "bg-destructive/10 border border-destructive/30" : "bg-emerald-50 border border-emerald-200"
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className={`size-4 ${calcResult.crossed ? "text-destructive" : "text-emerald-600"}`} />
                <span className={`font-semibold ${calcResult.crossed ? "text-destructive" : "text-emerald-700"}`}>
                  {calcResult.crossed ? "⚠️ Threshold Crossed" : "✅ Below Threshold"}
                </span>
              </div>
              <p className="text-xs">{calcResult.message}</p>
              <div className="mt-2 bg-background rounded-lg h-3 overflow-hidden">
                <div
                  className={`h-full transition-all ${calcResult.crossed ? "bg-destructive" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(calcResult.ratio * 50, 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {(calcResult.ratio * 100).toFixed(0)}% of threshold
              </div>
            </div>
          )}
        </div>

        {/* ── 3. Infection Heatmap ─────────────────────── */}
        <div className="clinical-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="size-4 text-amber-500" />
            <h3 className="font-semibold text-sm">Infection Site Heatmap</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-2 text-muted-foreground">Site</th>
                  {pathogens.map(p => (
                    <th key={p.id} className="p-2 text-center text-muted-foreground italic">{p.shortName.split(" ")[1] || p.shortName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmap.map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 font-medium">{row.site}</td>
                    {pathogens.map(p => (
                      <td key={p.id} className="p-2 text-center">
                        <div
                          className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center text-[10px] font-bold"
                          style={{ backgroundColor: RISK_COLORS[row[p.shortName] as number] }}
                        >
                          {row[p.shortName] > 0 ? (
                            row[p.shortName] === 3 ? "!!!" : row[p.shortName] === 2 ? "!!" : "!"
                          ) : "–"}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 mt-3 text-[10px]">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{backgroundColor: RISK_COLORS[1]}} /> Low</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{backgroundColor: RISK_COLORS[2]}} /> High</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{backgroundColor: RISK_COLORS[3]}} /> Critical</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{backgroundColor: RISK_COLORS[0]}} /> Not reported</div>
          </div>
        </div>

        {/* ── Pathogen Risk Profile Bar Chart ─────────── */}
        <div className="clinical-card p-4">
          <h3 className="font-semibold text-sm mb-4">Pathogen Risk Profile Comparison</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={radarData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="pathogen" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="biomarkers" fill="#0d9488" name="Biomarkers" />
              <Bar dataKey="sites" fill="#6366f1" name="Infection Sites" />
              <Bar dataKey="amr" fill="#ef4444" name="AMR Genes" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </>
  );
}
