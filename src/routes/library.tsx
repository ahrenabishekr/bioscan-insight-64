import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill } from "@/components/AppShell";
import { pathogens } from "@/data/pathogens";
import { Shield, Zap, FlaskConical, AlertTriangle, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/library")({
  component: () => <AppShell><Page /></AppShell>,
  head: () => ({ meta: [{ title: "Pathogen library — ChemoSense" }] }),
});

const GRAM_COLOR: Record<string, string> = {
  "Gram-negative": "bg-rose-50 text-rose-700 border-rose-200",
  "Gram-positive": "bg-blue-50 text-blue-700 border-blue-200",
  "Acid-fast": "bg-amber-50 text-amber-700 border-amber-200",
};

const RISK_BG: Record<string, string> = {
  Critical: "from-red-50 to-background",
  High: "from-amber-50 to-background",
  Moderate: "from-blue-50 to-background",
  Low: "from-emerald-50 to-background",
};

const RISK_BORDER: Record<string, string> = {
  Critical: "border-t-4 border-t-destructive",
  High: "border-t-4 border-t-amber-400",
  Moderate: "border-t-4 border-t-blue-400",
  Low: "border-t-4 border-t-emerald-400",
};

function Page() {
  const critical = pathogens.filter(p => p.riskLevel === "Critical");
  const high = pathogens.filter(p => p.riskLevel === "High");

  return (
    <>
      <PageHeader title="Pathogen Library"
        subtitle={`${pathogens.length} pathogens · ${pathogens.reduce((a, p) => a + p.biomarkers.length, 0)} biomarkers · ${pathogens.reduce((a, p) => a + p.amrGenes.length, 0)} AMR genes`} />

      <div className="px-6 py-6 max-w-6xl space-y-8">

        {/* Summary strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Critical Priority", value: critical.length, icon: AlertTriangle, color: "text-destructive bg-destructive/10" },
            { label: "High Priority", value: high.length, icon: Shield, color: "text-amber-600 bg-amber-50" },
            { label: "Total Biomarkers", value: pathogens.reduce((a, p) => a + p.biomarkers.length, 0), icon: FlaskConical, color: "text-primary bg-primary/10" },
            { label: "AMR Genes Tracked", value: pathogens.reduce((a, p) => a + p.amrGenes.length, 0), icon: Zap, color: "text-violet-600 bg-violet-50" },
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

        {/* Critical section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="size-4 text-destructive" />
            <h2 className="text-sm font-semibold text-destructive">Critical Priority Pathogens</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {critical.map(p => <PathogenCard key={p.id} p={p} />)}
          </div>
        </div>

        {/* High section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="size-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-700">High Priority Pathogens</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {high.map(p => <PathogenCard key={p.id} p={p} />)}
          </div>
        </div>

      </div>
    </>
  );
}

function PathogenCard({ p }: { p: typeof pathogens[0] }) {
  return (
    <Link to="/library/$id" params={{ id: p.id }}
      className={`clinical-card overflow-hidden hover:shadow-md transition-all hover:border-primary ${RISK_BORDER[p.riskLevel] || ""}`}>
      {/* Header */}
      <div className={`px-5 pt-5 pb-4 bg-gradient-to-b ${RISK_BG[p.riskLevel] || "from-muted/30 to-background"}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="text-base font-bold italic">{p.shortName}</div>
            <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border mt-1 ${GRAM_COLOR[p.gram] || "bg-muted text-muted-foreground border-border"}`}>
              {p.gram}
            </span>
          </div>
          <RiskPill level={p.riskLevel} />
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{p.summary}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
        {[
          { n: p.biomarkers.length, l: "Biomarkers", icon: FlaskConical },
          { n: p.amrGenes.length, l: "AMR genes", icon: Zap },
          { n: p.infectionSites.length, l: "Sites", icon: Shield },
        ].map(s => (
          <div key={s.l} className="py-3 px-2 text-center">
            <div className="text-lg font-bold text-primary">{s.n}</div>
            <div className="text-[10px] text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Key biomarker */}
      <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-muted-foreground">Top biomarker</div>
          <div className="text-xs font-medium">{p.biomarkers[0]?.name}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground">LOD</div>
          <div className="text-xs font-mono text-primary">{p.biomarkers[0]?.lod}</div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground ml-2" />
      </div>

      {/* QS system tag */}
      <div className="px-5 py-2.5 border-t border-border flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">QS:</span>
        <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{p.qsSystem.name}</span>
        <span className="text-[10px] text-muted-foreground ml-auto">{p.qsSystem.molecules.length} molecules</span>
      </div>
    </Link>
  );
}
