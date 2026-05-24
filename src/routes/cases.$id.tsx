import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill, LabRow } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { findCase, updateCase, type ClinicalCase } from "@/lib/cases";
import { findPathogen } from "@/data/pathogens";
import { findSensor } from "@/data/sensors";
import { Printer, Mail, Save, Download } from "lucide-react";
import jsPDF from "jspdf";

export const Route = createFileRoute("/cases/$id")({
  component: () => <AppShell><Page /></AppShell>,
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
    // Send via backend
    fetch("https://chemosense-backend-production.up.railway.app/api/email-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: c!.doctor.includes("@") ? c!.doctor : "rahrenabishek2006@gmail.com",
        caseId: c!.id,
        doctor: c!.doctor,
        pathogen: p.name,
        riskLevel: p.riskLevel,
        biomarker: b.name,
        sensor: s.name,
        treatment: p.empiricalTreatment,
        createdAt: c!.createdAt,
      }),
    }).then(() => alert("Report emailed successfully! ✅")).catch(() => alert("Email failed"));
  }

  function downloadPDF() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header
    doc.setFillColor(13, 148, 136);
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("ChemoSense Clinical Report", 14, 18);

    // Reset color
    doc.setTextColor(30, 41, 59);
    y = 45;

    // Case info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Case ID: ${c!.id}`, 14, y); y += 7;
    doc.text(`Date: ${new Date(c!.createdAt).toLocaleString()}`, 14, y); y += 7;
    doc.text(`Doctor: ${c!.doctor}`, 14, y); y += 7;
    doc.text(`Scan mode: ${c!.mode === "symptom" ? "Symptom presentation" : "Biomarker detection"}`, 14, y); y += 12;

    // Pathogen
    doc.setFillColor(240, 253, 250);
    doc.rect(14, y - 5, pageWidth - 28, 30, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 148, 136);
    doc.text(p.name, 18, y + 5); 
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    doc.text(`${p.gram} • Risk Level: ${p.riskLevel}`, 18, y + 14);
    y += 38;

    // Detection
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Detection", 14, y); y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Sensor: ${s.name}`, 14, y); y += 7;
    doc.text(`Biomarker: ${b.name} (${b.type})`, 14, y); y += 7;
    doc.text(`LOD: ${b.lod}  |  Detection time: ${b.detectionTime}`, 14, y); y += 7;
    doc.text(`Mechanism: ${b.mechanism}`, 14, y); y += 7;
    doc.text(`Clinical meaning: ${b.clinicalMeaning}`, 14, y); y += 12;

    // QS System
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Quorum Sensing", 14, y); y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`System: ${p.qsSystem.name}`, 14, y); y += 7;
    doc.text(`Molecules: ${p.qsSystem.molecules.join(", ")}`, 14, y); y += 7;
    const qsLines = doc.splitTextToSize(`Clinical note: ${p.qsSystem.clinicalNote}`, pageWidth - 28);
    doc.text(qsLines, 14, y); y += qsLines.length * 7 + 5;

    // AMR
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("AMR Status", 14, y); y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    p.amrGenes.forEach((g) => {
      doc.text(`• ${g.gene}: ${g.resistance}`, 14, y); y += 7;
    });
    y += 5;

    // Treatment
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Empirical Treatment", 14, y); y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    p.empiricalTreatment.forEach((t) => {
      doc.text(`• ${t}`, 14, y); y += 7;
    });
    y += 5;

    // Notes
    if (notes) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Clinical Notes", 14, y); y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const noteLines = doc.splitTextToSize(notes, pageWidth - 28);
      doc.text(noteLines, 14, y); y += noteLines.length * 7 + 5;
    }

    // Footer
    doc.setFillColor(13, 148, 136);
    doc.rect(0, 285, pageWidth, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("ChemoSense — Clinical decision support. Not a substitute for laboratory confirmation.", 14, 292);

    doc.save(`ChemoSense-${c!.id}.pdf`);
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
            <button onClick={downloadPDF} className="h-9 px-3 text-xs border border-border rounded-md inline-flex items-center gap-1.5 hover:bg-muted bg-primary text-primary-foreground">
              <Download className="size-3.5" /> Download PDF
            </button>
            <button onClick={() => window.print()} className="h-9 px-3 text-xs border border-border rounded-md inline-flex items-center gap-1.5 hover:bg-muted">
              <Printer className="size-3.5" /> Print
            </button>
            <button onClick={shareEmail} className="h-9 px-3 text-xs border border-border rounded-md inline-flex items-center gap-1.5 hover:bg-muted">
              <Mail className="size-3.5" /> Email
            </button>
          </div>
        }
      />

      <div className="px-6 py-6 max-w-4xl">
        <div className="clinical-card p-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Pathogen identified</div>
            <div className="text-2xl font-semibold italic mt-0.5">{p.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{p.gram} • Mode: {c.mode === "symptom" ? "Symptom presentation" : "Biomarker detection"}</div>
          </div>
          <RiskPill level={p.riskLevel} />
        </div>

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

        <div className="clinical-card p-5 mt-5">
          <h2 className="text-sm font-semibold mb-2">Quorum sensing</h2>
          <dl>
            <LabRow label="QS system">{p.qsSystem.name}</LabRow>
            <LabRow label="QS molecules">{p.qsSystem.molecules.join(", ")}</LabRow>
            <LabRow label="Clinical implication">{p.qsSystem.clinicalNote}</LabRow>
          </dl>
        </div>

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

        <div className="clinical-card p-5 mt-5">
          <h2 className="text-sm font-semibold mb-2">Empirical treatment</h2>
          <ol className="text-sm space-y-1.5 list-decimal list-inside text-foreground">
            {p.empiricalTreatment.map((t) => <li key={t}>{t}</li>)}
          </ol>
          <p className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            Confirm by culture and sensitivity. De-escalate per local antibiogram.
          </p>
        </div>

        <div className="clinical-card p-5 mt-5 no-print">
          <h2 className="text-sm font-semibold mb-2">Clinical notes</h2>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
            placeholder="Add follow-up, response to therapy, additional findings…"
            className="w-full p-3 text-sm border border-input rounded-md" />
          <button onClick={saveNotes} className="mt-2 h-9 px-3 text-xs rounded-md bg-primary text-primary-foreground inline-flex items-center gap-1.5">
            <Save className="size-3.5" /> Save notes
          </button>
        </div>

        <p className="mt-6 text-[11px] text-muted-foreground">
          ChemoSense — Clinical decision support. Not a substitute for laboratory confirmation.
        </p>
      </div>
    </>
  );
}
