import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { pathogens } from "@/data/pathogens";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend, CartesianGrid } from "recharts";
import { AlertTriangle, FlaskConical, TrendingUp, Activity, Info } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  component: () => <AppShell><Page /></AppShell>,
  head: () => ({ meta: [{ title: "Analytics — ChemoSense" }] }),
});

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
    ab: [
      { hour: 0, load: 1, stage: "Colonisation" },
      { hour: 6, load: 12, stage: "Biofilm" },
      { hour: 18, load: 90, stage: "Toxin" },
      { hour: 36, load: 500, stage: "Sepsis Risk" },
      { hour: 60, load: 2500, stage: "Critical" },
      { hour: 72, load: 5000, stage: "Septic Shock" },
    ],
    ec: [
      { hour: 0, load: 1, stage: "Colonisation" },
      { hour: 5, load: 25, stage: "Rapid Growth" },
      { hour: 10, load: 200, stage: "Invasion" },
      { hour: 20, load: 1000, stage: "Virulence" },
      { hour: 40, load: 5000, stage: "Sepsis Risk" },
      { hour: 72, load: 12000, stage: "Critical" },
    ],
  };
  return spreads[pathogenId] || spreads["pa"];
}

const SITES = ["Wound", "Lung", "UTI", "Bloodstream", "Catheter", "Bone", "CNS"];

function buildHeatmap() {
  return SITES.map(site => {
    const row: Record<string, any> = { site };
    pathogens.forEach(p => {
      const match = p.infectionSites.some(s =>
        s.toLowerCase().includes(site.toLowerCase()) ||
        (site === "Wound" && s.toLowerCase().includes("wound")) ||
        (site === "Lung" && (s.toLowerCase().includes("lung") || s.toLowerCase().includes("pneum") || s.toLowerCase().includes("vap"))) ||
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

const RISK_COLORS: Record<number, string> = { 0: "#f1f5f9", 1: "#fef08a", 2: "#fb923c", 3: "#ef4444" };
const RISK_LABELS: Record<number, string> = { 0: "–", 1: "!", 2: "!!", 3: "!!!" };

function Page() {
  const [selectedPathogen, setSelectedPathogen] = useState(pathogens[0]);
  const [lod, setLod] = useState("");
  const [concentration, setConcentration] = useState("");
  const [calcResult, setCalcResult] = useState<null | { crossed: boolean; ratio: number; message: string }>(null);

  const timeline = getRiskTimeline(selectedPathogen.id);
  const heatmap = buildHeatmap();

  const pathogenProfileData = pathogens.map(p => ({
    name: p.shortName,
    Biomarkers: p.biomarkers.length,
    "Infection Sites": p.infectionSites.length,
    "AMR Genes": p.amrGenes.length,
  }));

  function calculate() {
    const l = parseFloat(lod);
    const c = parseFloat(concentration);
    if (isNaN(l) || isNaN(c) || l <= 0) return;
    const ratio = c / l;
    const crossed = ratio >= 1;
    setCalcResult({
      crossed,
      ratio,
      message: crossed
        ? `Detection confirmed — concentration is ${ratio.toFixed(1)}× above LOD. Pathogen presence likely.`
        : `Below detection threshold — concentration is ${(ratio * 100).toFixed(0)}% of LOD. Consider repeat testing.`,
    });
  }

  return (
    <>
      <PageHeader title="Clinical Analytics"
        subtitle="Infection risk timelines, site heatmap & biomarker detection calculator" />
      <div className="px-6 py-6 max-w-6xl space-y-6">

        {/* Purpose banner */}
        <div className="clinical-card p-4 bg-primary/5 border-primary/20 flex items-start gap-3">
          <Info className="size-4 text-primary mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">How to use Analytics:</span> Use the
            <span className="text-primary font-medium"> Infection Timeline</span> to understand how fast a pathogen spreads after detection. Use the
            <span className="text-primary font-medium"> Heatmap</span> to identify which pathogens affect which body sites. Use the
            <span className="text-primary font-medium"> Calculator</span> to determine if a sensor reading has crossed the limit of detection.
          </div>
        </div>

        {/* Section 1 — Infection Timeline */}
        <div className="clinical-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <div>
                <h2 className="text-sm font-semibold">Infection Risk Timeline</h2>
                <p className="text-[11px] text-muted-foreground">Bacterial load progression if untreated — shows when QS activates and sepsis risk begins</p>
              </div>
            </div>
            <select value={selectedPathogen.id}
              onChange={e => setSelectedPathogen(pathogens.find(p => p.id === e.target.value) || pathogens[0])}
              className="h-9 px-3 text-xs border border-input rounded-md bg-background">
              {pathogens.map(p => <option key={p.id} value={p.id}>{p.shortName}</option>)}
            </select>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {timeline.filter((_, i) => [1, 3, 5].includes(i)).map(t => (
                <div key={t.hour} className={`rounded-lg p-3 border ${t.stage.includes("Critical") || t.stage.includes("Sepsis") || t.stage.includes("Shock") ? "bg-destructive/5 border-destructive/20" : "bg-muted/30 border-border"}`}>
                  <div className="text-[10px] text-muted-foreground">Hour {t.hour}</div>
                  <div className="text-sm font-semibold">{t.stage}</div>
                  <div className="text-xs font-mono text-primary">{t.load.toLocaleString()} CFU/mL</div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} label={{ value: "Hours", position: "insideBottom", offset: -2, fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any, _, p) => [`${Number(v).toLocaleString()} CFU/mL — ${p.payload.stage}`, "Bacterial load"]} />
                <Line type="monotone" dataKey="load" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: "#ef4444" }} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              ⚠️ Reference model only — actual progression depends on host immunity, antibiotic therapy, and site of infection
            </p>
          </div>
        </div>

        {/* Section 2 — Heatmap */}
        <div className="clinical-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">Infection Site Heatmap</h2>
              <p className="text-[11px] text-muted-foreground">Which pathogens affect which body sites, and at what risk level</p>
            </div>
          </div>
          <div className="p-5 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium w-24">Site</th>
                  {pathogens.map(p => (
                    <th key={p.id} className="text-center py-2 px-2 text-muted-foreground font-medium italic">{p.shortName.split(" ")[1] || p.shortName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmap.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="py-2 pr-4 font-medium text-foreground">{row.site}</td>
                    {pathogens.map(p => {
                      const val = row[p.shortName] as number;
                      return (
                        <td key={p.id} className="py-2 px-2 text-center">
                          <span className="inline-flex size-8 rounded-lg items-center justify-center text-[10px] font-bold text-white"
                            style={{ backgroundColor: RISK_COLORS[val], color: val > 0 ? "white" : "#94a3b8" }}>
                            {RISK_LABELS[val]}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
              {[{ c: "#fef08a", l: "Low" }, { c: "#fb923c", l: "High" }, { c: "#ef4444", l: "Critical" }, { c: "#f1f5f9", l: "Not reported" }].map(x => (
                <div key={x.l} className="flex items-center gap-1.5">
                  <span className="size-3 rounded-sm inline-block border border-border" style={{ backgroundColor: x.c }} />
                  {x.l}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3 — Biomarker Calculator */}
        <div className="clinical-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <FlaskConical className="size-4 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">Biomarker Detection Calculator</h2>
              <p className="text-[11px] text-muted-foreground">Check if a sensor reading has crossed the limit of detection (LOD) for a given biomarker</p>
            </div>
          </div>
          <div className="p-5">
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium block mb-1">Sensor LOD (nM)</label>
                <input value={lod} onChange={e => setLod(e.target.value)} type="number" placeholder="e.g. 0.5"
                  className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Measured concentration (nM)</label>
                <input value={concentration} onChange={e => setConcentration(e.target.value)} type="number" placeholder="e.g. 2.4"
                  className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background" />
              </div>
              <div className="flex items-end">
                <button onClick={calculate} disabled={!lod || !concentration}
                  className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                  Calculate
                </button>
              </div>
            </div>
            {calcResult && (
              <div className={`p-4 rounded-lg border flex items-start gap-3 ${calcResult.crossed ? "bg-destructive/5 border-destructive/30" : "bg-emerald-50 border-emerald-200"}`}>
                <AlertTriangle className={`size-4 mt-0.5 shrink-0 ${calcResult.crossed ? "text-destructive" : "text-emerald-600"}`} />
                <div>
                  <div className={`text-sm font-semibold ${calcResult.crossed ? "text-destructive" : "text-emerald-700"}`}>
                    {calcResult.crossed ? "LOD Crossed — Detection Positive" : "Below LOD — Not Detected"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{calcResult.message}</div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden w-48">
                    <div className={`h-full rounded-full ${calcResult.crossed ? "bg-destructive" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(100, calcResult.ratio * 50)}%` }} />
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
              {pathogens[0].biomarkers.map(b => (
                <button key={b.name} onClick={() => { setLod(b.lod.replace(/[^\d.]/g, "")); }}
                  className="text-left p-2 rounded-md border border-border hover:bg-muted/50 transition-colors">
                  <div className="text-[10px] font-medium truncate">{b.name}</div>
                  <div className="text-[10px] text-primary font-mono">LOD: {b.lod}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4 — Pathogen Profile Chart */}
        <div className="clinical-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">Pathogen Risk Profile Comparison</h2>
              <p className="text-[11px] text-muted-foreground">Compare biomarker count, infection sites, and AMR genes across all pathogens</p>
            </div>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pathogenProfileData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Biomarkers" fill="#0d9488" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Infection Sites" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="AMR Genes" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </>
  );
}
