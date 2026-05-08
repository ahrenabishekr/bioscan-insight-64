import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill } from "@/components/AppShell";
import { useState } from "react";
import { pathogens } from "@/data/pathogens";

export const Route = createFileRoute("/compare")({
  component: () => <AppShell><Page /></AppShell>,
  head: () => ({ meta: [{ title: "Compare pathogens — ChemoSense" }] }),
});

function Page() {
  const [a, setA] = useState(pathogens[0].id);
  const [b, setB] = useState(pathogens[1].id);
  const A = pathogens.find((p) => p.id === a)!;
  const B = pathogens.find((p) => p.id === b)!;
  return (
    <>
      <PageHeader title="Compare pathogens" subtitle="Side-by-side clinical and sensor profile." />
      <div className="px-6 py-6">
        <div className="grid sm:grid-cols-2 gap-3 max-w-xl">
          <Sel value={a} onChange={setA} label="Pathogen A" />
          <Sel value={b} onChange={setB} label="Pathogen B" />
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          {[A, B].map((p) => (
            <div key={p.id} className="clinical-card p-5">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold italic">{p.name}</div>
                <RiskPill level={p.riskLevel} />
              </div>
              <Row k="Gram" v={p.gram} />
              <Row k="Sites" v={p.infectionSites.join(", ")} />
              <Row k="QS system" v={p.qsSystem.name} />
              <Row k="QS molecules" v={p.qsSystem.molecules.join(", ")} />
              <Row k="Biomarkers" v={p.biomarkers.map((x) => x.name).join(", ")} />
              <Row k="Top biomarker LOD" v={`${p.biomarkers[0].name} — ${p.biomarkers[0].lod}`} />
              <Row k="AMR" v={p.amrGenes.map((g) => g.gene).join(", ")} />
              <Row k="First-line" v={p.empiricalTreatment[0]} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Sel({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full h-10 border border-input rounded-md px-2 text-sm bg-background">
        {pathogens.map((p) => <option key={p.id} value={p.id}>{p.shortName}</option>)}
      </select>
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 py-2 border-b border-border text-xs last:border-0">
      <dt className="text-muted-foreground">{k}</dt><dd>{v}</dd>
    </div>
  );
}
