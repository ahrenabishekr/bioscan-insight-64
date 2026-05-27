import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill } from "@/components/AppShell";
import { useState } from "react";
import { pathogens } from "@/data/pathogens";
import { FlaskConical, Zap, Shield, Activity, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/compare")({
  component: () => <AppShell><Page /></AppShell>,
  head: () => ({ meta: [{ title: "Compare pathogens — ChemoSense" }] }),
});

const RISK_SCORE: Record<string, number> = { Critical: 4, High: 3, Moderate: 2, Low: 1 };
const RISK_COLOR: Record<string, string> = {
  Critical: "bg-destructive",
  High: "bg-amber-400",
  Moderate: "bg-blue-400",
  Low: "bg-emerald-400",
};

function Page() {
  const [a, setA] = useState(pathogens[0].id);
  const [b, setB] = useState(pathogens[1].id);
  const A = pathogens.find((p) => p.id === a)!;
  const B = pathogens.find((p) => p.id === b)!;

  return (
    <>
      <PageHeader title="Compare Pathogens" subtitle="Side-by-side clinical, sensor, and resistance profile." />
      <div className="px-6 py-6 max-w-6xl">

        {/* Selector */}
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Pathogen A</label>
            <select value={a} onChange={e => setA(e.target.value)}
              className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background font-medium">
              {pathogens.map(p => <option key={p.id} value={p.id}>{p.shortName}</option>)}
            </select>
          </div>
          <div className="size-8 rounded-full border border-border grid place-items-center text-muted-foreground text-xs font-bold mt-4">VS</div>
          <div className="flex-1 min-w-48">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Pathogen B</label>
            <select value={b} onChange={e => setB(e.target.value)}
              className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background font-medium">
              {pathogens.map(p => <option key={p.id} value={p.id}>{p.shortName}</option>)}
            </select>
          </div>
        </div>

        {/* Hero comparison cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {[A, B].map((p, idx) => (
            <div key={p.id} className={`clinical-card overflow-hidden border-t-4 ${idx === 0 ? "border-t-primary" : "border-t-amber-400"}`}>
              <div className="p-5 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xl font-bold italic">{p.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{p.gram}</div>
                  </div>
                  <RiskPill level={p.riskLevel} />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.summary}</p>
              </div>

              {/* Risk score bar */}
              <div className="px-5 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk score</span>
                  <span className="text-[10px] font-bold">{RISK_SCORE[p.riskLevel]}/4</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${RISK_COLOR[p.riskLevel]}`}
                    style={{ width: `${(RISK_SCORE[p.riskLevel] / 4) * 100}%` }} />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
                {[
                  { n: p.biomarkers.length, l: "Biomarkers", icon: FlaskConical },
                  { n: p.amrGenes.length, l: "AMR genes", icon: Zap },
                  { n: p.infectionSites.length, l: "Sites", icon: Shield },
                ].map(s => (
                  <div key={s.l} className="py-3 text-center">
                    <div className="text-lg font-bold">{s.n}</div>
                    <div className="text-[10px] text-muted-foreground">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Section comparisons */}
        {[
          {
            title: "Quorum Sensing",
            icon: Activity,
            rows: [
              { label: "QS System", a: A.qsSystem.name, b: B.qsSystem.name },
              { label: "Molecules", a: A.qsSystem.molecules.join(", "), b: B.qsSystem.molecules.join(", ") },
              { label: "Clinical note", a: A.qsSystem.clinicalNote, b: B.qsSystem.clinicalNote },
            ]
          },
          {
            title: "Biomarker Detection",
            icon: FlaskConical,
            rows: [
              { label: "Top biomarker", a: A.biomarkers[0]?.name, b: B.biomarkers[0]?.name },
              { label: "LOD", a: A.biomarkers[0]?.lod, b: B.biomarkers[0]?.lod },
              { label: "Detection time", a: A.biomarkers[0]?.detectionTime, b: B.biomarkers[0]?.detectionTime },
              { label: "All biomarkers", a: A.biomarkers.map(x => x.name).join(", "), b: B.biomarkers.map(x => x.name).join(", ") },
            ]
          },
          {
            title: "AMR & Resistance",
            icon: Zap,
            rows: [
              { label: "Resistance genes", a: A.amrGenes.map(g => g.gene).join(", "), b: B.amrGenes.map(g => g.gene).join(", ") },
              { label: "First-line treatment", a: A.empiricalTreatment[0], b: B.empiricalTreatment[0] },
              { label: "Second-line", a: A.empiricalTreatment[1] || "—", b: B.empiricalTreatment[1] || "—" },
            ]
          },
          {
            title: "Infection Sites",
            icon: Shield,
            rows: [
              { label: "Primary sites", a: A.infectionSites.slice(0, 3).join(", "), b: B.infectionSites.slice(0, 3).join(", ") },
              { label: "All sites", a: A.infectionSites.join(", "), b: B.infectionSites.join(", ") },
            ]
          },
        ].map(section => (
          <div key={section.title} className="clinical-card overflow-hidden mb-4">
            <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
              <section.icon className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">{section.title}</h3>
            </div>
            <div className="divide-y divide-border">
              {section.rows.map(row => (
                <div key={row.label} className="grid grid-cols-[120px_1fr_1fr] text-xs">
                  <div className="px-5 py-3 text-muted-foreground font-medium bg-muted/10 flex items-center">{row.label}</div>
                  <div className={`px-5 py-3 border-l border-border ${row.a !== row.b ? "text-primary font-medium" : ""}`}>{row.a}</div>
                  <div className={`px-5 py-3 border-l border-border ${row.a !== row.b ? "text-amber-600 font-medium" : ""}`}>{row.b}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Links to full profiles */}
        <div className="grid md:grid-cols-2 gap-4 mt-2">
          {[A, B].map((p, idx) => (
            <Link key={p.id} to="/library/$id" params={{ id: p.id }}
              className={`clinical-card p-4 flex items-center justify-between hover:bg-muted/50 transition-colors border-l-4 ${idx === 0 ? "border-l-primary" : "border-l-amber-400"}`}>
              <div>
                <div className="text-xs text-muted-foreground">Full profile</div>
                <div className="text-sm font-semibold italic mt-0.5">{p.name}</div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>

      </div>
    </>
  );
}
