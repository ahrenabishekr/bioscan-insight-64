import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill, LabRow } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { findCase, updateCase, type ClinicalCase } from "@/lib/cases";
import { findPathogen } from "@/data/pathogens";
import { findSensor } from "@/data/sensors";
import { Printer, Mail, Save } from "lucide-react";

export const Route = createFileRoute("/cases/$id")({
  component: () => (
    <AppShell>
      <Page />
    </AppShell>
  ),
  head: () => ({ meta: [{ title: "Case report — ChemoSense" }] }),
});

function Page() {
  const { id } = useParams({ from: "/cases/$id" });
  const [c, setC] = useState<ClinicalCase | undefined>();
  const [notes, setNotes] = useState("");
  useEffect(() => {
    const fc = findCase(id);
    setC(fc);
    setNotes(fc?.notes ?? "");
  }, [id]);

  if (!c) {
    return <div className="p-6 text-sm">Case not found. <Link to="/cases" className="text-primary">Back to cases</Link>.</div>;
  }
  const p = findPathogen(c.pathogenId)!;
  const b = p.biomarkers.find((x) => x.name === c.biomarkerName) ?? p.biomarkers[0];
  const s = findSensor(c.sensorId)!;

  function saveNotes() {
    updateCase(c!.id, { notes });
    alert("Notes saved.");
  }

  function shareEmail() {
    const body = `ChemoSense Clinical Report
Case ID: ${c!.id}
Date: ${new Date(c!.createdAt).toLocaleString()}
Doctor: ${c!.doctor}

PATHOGEN: ${p.name} (${p.gram})
Risk: ${p.riskLevel}

BIOMARKER: ${b.name}
Sensor: ${s.name}
LOD: ${b.lod}  Detection: ${b.detectionTime}
Mechanism: ${b.mechanism}
Clinical meaning: ${b.clinicalMeaning}

QS: ${p.qsSystem.name} — ${p.qsSystem.molecules.join(", ")}
${p.qsSystem.clinicalNote}

AMR: ${p.amrGenes.map((g) => `${g.gene} (${g.resistance})`).join("; ")}

Empirical treatment:
${p.empiricalTreatment.map((t) => "• " + t).join("\n")}
— Confirm by C&S.`;
    window.location.href = `mailto:?subject=${encodeURIComponent("Case " + c!.id + " — " + p.shortName)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <>
      <PageHeader
        title="Clinical report"
        subtitle={
          <>
            <span className="font-mono text-xs">{c.id}</span> · {new Date(c.createdAt).toLocaleString()} · {c.doctor}
          </> as unknown as string
        }
        actions={
          <div className="flex gap-2 no-print">
            <button onClick={() => window.print()} className="h-9 px-3 text-xs border border-border rounded-md inline-flex items-center gap-1.5 hover:bg-muted">
              <Printer className="size-3.5" /> Print / PDF
            </button>
            <button onClick={shareEmail} className="h-9 px-3 text-xs border border-border rounded-md inline-flex items-center gap-1.5 hover:bg-muted">
              <Mail className="size-3.5" /> Share
            </button>
          </div>
        }
      />

      <div className="px-6 py-6 max-w-4xl">
        {/* Header strip */}
        <div className="clinical-card p-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Pathogen identified</div>
            <div className="text-2xl font-semibold italic mt-0.5">{p.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{p.gram} • Mode: {c.mode === "symptom" ? "Symptom presentation" : "Biomarker detection"}</div>
          </div>
          <RiskPill level={p.riskLevel} />
        </div>

        {/* Sensor / biomarker */}
        <div className="clinical-card p-5 mt-5">
          <h2 className="text-sm font-semibold mb-2">Detection</h2>
          <dl>
            <LabRow label="Recommended sensor">{s.name}</LabRow>
            <LabRow label="Target biomarker">{b.name} ({b.type})</LabRow>
            <LabRow label="LOD">{b.lod}</LabRow>
            <LabRow label="Detection time">{b.detectionTime}</LabRow>
            <LabRow label="Mechanism">{b.mechanism}</LabRow>
          </dl>
        </div>

        {/* QS */}
        <div className="clinical-card p-5 mt-5">
          <h2 className="text-sm font-semibold mb-2">Quorum sensing</h2>
          <dl>
            <LabRow label="QS system">{p.qsSystem.name}</LabRow>
            <LabRow label="QS molecules">{p.qsSystem.molecules.join(", ")}</LabRow>
            <LabRow label="Clinical implication">{p.qsSystem.clinicalNote}</LabRow>
          </dl>
        </div>

        {/* AMR */}
        <div className="clinical-card p-5 mt-5">
          <h2 className="text-sm font-semibold mb-2">AMR status</h2>
          <table className="w-full text-xs">
            <thead className="text-muted-foreground border-b border-border">
              <tr><th className="text-left py-2 pr-4">Resistance gene</th><th className="text-left py-2">Confers resistance to</th></tr>
            </thead>
            <tbody>
              {p.amrGenes.map((g) => (
                <tr key={g.gene} className="border-b border-border last:border-0">
                  <td className="py-2 pr-4 font-mono">{g.gene}</td>
                  <td className="py-2">{g.resistance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Treatment */}
        <div className="clinical-card p-5 mt-5">
          <h2 className="text-sm font-semibold mb-2">Empirical treatment</h2>
          <ol className="text-sm space-y-1.5 list-decimal list-inside text-foreground">
            {p.empiricalTreatment.map((t) => <li key={t}>{t}</li>)}
          </ol>
          <p className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            Confirm by culture and sensitivity. De-escalate per local antibiogram.
          </p>
        </div>

        {/* Notes */}
        <div className="clinical-card p-5 mt-5 no-print">
          <h2 className="text-sm font-semibold mb-2">Clinical notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Add follow-up, response to therapy, additional findings…"
            className="w-full p-3 text-sm border border-input rounded-md"
          />
          <button onClick={saveNotes} className="mt-2 h-9 px-3 text-xs rounded-md bg-primary text-primary-foreground inline-flex items-center gap-1.5">
            <Save className="size-3.5" /> Save notes
          </button>
        </div>
        {c.notes && (
          <div className="hidden print:block mt-5">
            <h2 className="text-sm font-semibold mb-1">Clinical notes</h2>
            <p className="text-sm whitespace-pre-wrap">{c.notes}</p>
          </div>
        )}

        <p className="mt-6 text-[11px] text-muted-foreground">
          ChemoSense — Clinical decision support. Not a substitute for laboratory confirmation.
        </p>
      </div>
    </>
  );
}