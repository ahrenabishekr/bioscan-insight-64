import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill, LabRow } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { findPathogen } from "@/data/pathogens";
import { Printer, Mail, Save, Download, Loader2, CheckCircle } from "lucide-react";
import jsPDF from "jspdf";
import { apiFetch } from "@/lib/apiClient";

const API_URL = "https://chemosense-backend.onrender.com/api";

export const Route = createFileRoute("/cases/$id")({
  component: () => <AppShell><Page /></AppShell>,
  head: () => ({ meta: [{ title: "Case report — ChemoSense" }] }),
});

function Page() {
  const { id } = useParams({ from: "/cases/$id" });
  const [c, setC] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState("");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [caseRes, scansRes] = await Promise.all([
          apiFetch(`${API_URL}/cases`),
          apiFetch(`${API_URL}/scans`),
        ]);
        const cases = await caseRes.json();
        const allScans = await scansRes.json();
        const found = cases.find((x: any) => String(x.id) === String(id));
        const linked = allScans.filter((s: any) => String(s.case_id) === String(id));
        setC(found ?? null);
        setScans(linked);
        setNotes(found?.notes ?? "");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function closeCase() {
    if (!outcome) return;
    setClosing(true);
    try {
      await apiFetch(`${API_URL}/cases/${id}/outcome`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, outcome_notes: outcomeNotes }),
      });
      setC((prev: any) => ({ ...prev, status: "closed" }));
    } finally { setClosing(false); }
  }

  async function saveNotes() {
    setSaving(true);
    try {
      await apiFetch(`${API_URL}/cases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...c, notes }),
      });
      setC((prev: any) => ({ ...prev, notes }));
      alert("Notes saved ✅");
    } finally { setSaving(false); }
  }

  function downloadPDF() {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFillColor(13, 148, 136);
    doc.rect(0, 0, pw, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18).setFont("helvetica", "bold");
    doc.text("ChemoSense Clinical Report", 14, 18);

    doc.setTextColor(30, 41, 59);
    y = 45;
    doc.setFontSize(10).setFont("helvetica", "normal");
    doc.text(`Case ID: ${c.id}`, 14, y); y += 7;
    doc.text(`Patient: ${c.patient_id || c.patient_name || "—"}`, 14, y); y += 7;
    doc.text(`Status: ${c.status}`, 14, y); y += 7;
    doc.text(`Created: ${new Date(c.created_at).toLocaleString()}`, 14, y); y += 12;

    scans.forEach((s: any) => {
      const p = findPathogen(s.pathogen_name) ?? { name: s.pathogen_name, riskLevel: s.risk_level, empiricalTreatment: [] };
      doc.setFillColor(240, 253, 250);
      doc.rect(14, y - 4, pw - 28, 36, "F");
      doc.setFontSize(13).setFont("helvetica", "bold").setTextColor(13, 148, 136);
      doc.text(s.pathogen_name || "Unknown", 18, y + 6);
      doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(80, 80, 80);
      doc.text(`Biomarker: ${s.biomarker_name || "—"}  |  Risk: ${s.risk_level || "—"}`, 18, y + 16);
      doc.text(`Scanned by: ${s.scanned_by || "—"}  |  Date: ${new Date(s.created_at).toLocaleString()}`, 18, y + 25);
      y += 46;
    });

    if (notes) {
      doc.setFontSize(12).setFont("helvetica", "bold").setTextColor(30, 41, 59);
      doc.text("Clinical Notes", 14, y); y += 8;
      doc.setFontSize(10).setFont("helvetica", "normal");
      doc.splitTextToSize(notes, pw - 28).forEach((line: string) => { doc.text(line, 14, y); y += 7; });
    }

    doc.setFillColor(13, 148, 136);
    doc.rect(0, 285, pw, 12, "F");
    doc.setTextColor(255, 255, 255).setFontSize(8);
    doc.text("ChemoSense — Clinical decision support. Not a substitute for laboratory confirmation.", 14, 292);
    doc.save(`ChemoSense-Case-${c.id}.pdf`);
  }

  async function shareEmail() {
    if (!c || scans.length === 0) return alert("No scan data to email.");
    const session = (await import("@/lib/auth")).getSession();
    const toEmail = session?.email || "rahrenabishek2006@gmail.com";
    const s = scans[0];
    await apiFetch(`${API_URL}/email-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: toEmail,
        caseId: c.id,
        doctor: s.scanned_by || "—",
        pathogen: s.pathogen_name,
        riskLevel: s.risk_level,
        biomarker: s.biomarker_name,
        sensor: "ChemoSense Sensor",
        treatment: [],
        createdAt: c.created_at,
      }),
    }).then(() => alert("Report emailed ✅")).catch(() => alert("Email failed"));
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Loading case…</div>;
  if (!c) return <div className="p-6 text-sm">Case not found. <Link to="/cases" className="text-primary">Back to cases</Link>.</div>;

  return (
    <>
      <PageHeader
        title={c.title || `Case #${c.id}`}
        subtitle={`Patient: ${c.patient_id || c.patient_name || "—"} · ${new Date(c.created_at).toLocaleString()}`}
        actions={
          <div className="flex gap-2 no-print flex-wrap">
            <button onClick={downloadPDF} className="h-9 px-3 text-xs rounded-md bg-primary text-primary-foreground inline-flex items-center gap-1.5">
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

      <div className="px-6 py-6 max-w-4xl space-y-5">
        <div className="clinical-card p-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Case</div>
            <div className="text-xl font-semibold mt-0.5">{c.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Status: <span className="font-medium capitalize">{c.status}</span></div>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded border ${c.status === "open" ? "bg-amber-50 text-amber-700 border-amber-300" : "bg-emerald-50 text-emerald-700 border-emerald-300"}`}>
            {c.status?.toUpperCase()}
          </span>
        </div>

        {scans.length > 0 && (
          <div className="clinical-card p-5">
            <h2 className="text-sm font-semibold mb-3">Scan Results ({scans.length})</h2>
            <div className="space-y-4">
              {scans.map((s: any) => (
                <div key={s.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-semibold italic text-base">{s.pathogen_name || "Unknown"}</span>
                    <RiskPill level={s.risk_level || "—"} />
                  </div>
                  <dl>
                    <LabRow label="Biomarker">{s.biomarker_name || "—"}</LabRow>
                    <LabRow label="Scanned by">{s.scanned_by || "—"}</LabRow>
                    <LabRow label="Date">{new Date(s.created_at).toLocaleString()}</LabRow>
                    {s.notes && <LabRow label="Notes">{s.notes}</LabRow>}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        )}

        {scans.length === 0 && (
          <div className="clinical-card p-5 text-sm text-muted-foreground">No scans linked to this case yet.</div>
        )}

        <div className="clinical-card p-5 no-print">
          <h2 className="text-sm font-semibold mb-2">Clinical notes</h2>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
            placeholder="Add follow-up, response to therapy, additional findings…"
            className="w-full p-3 text-sm border border-input rounded-md bg-background" />
          <button onClick={saveNotes} disabled={saving}
            className="mt-2 h-9 px-3 text-xs rounded-md bg-primary text-primary-foreground inline-flex items-center gap-1.5 disabled:opacity-60">
            {saving ? <><Loader2 className="size-3 animate-spin" /> Saving…</> : <><Save className="size-3.5" /> Save notes</>}
          </button>
        </div>

        {/* Treatment Outcome */}
        {c.status === "open" && (
          <div className="clinical-card p-5 no-print border-amber-200">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="size-4 text-emerald-500" /> Close Case &amp; Record Outcome
            </h2>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {["Recovered", "Escalated", "Referred", "Deceased", "Lost to follow-up"].map(o => (
                <button key={o} onClick={() => setOutcome(o)}
                  className={`h-9 px-3 text-xs rounded-md border transition-all ${outcome === o ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                  {o}
                </button>
              ))}
            </div>
            <textarea value={outcomeNotes} onChange={e => setOutcomeNotes(e.target.value)} rows={2}
              placeholder="Outcome notes (optional)…"
              className="w-full p-3 text-sm border border-input rounded-md bg-background mb-2" />
            <button onClick={closeCase} disabled={!outcome || closing}
              className="h-9 px-4 text-xs rounded-md bg-emerald-600 text-white inline-flex items-center gap-1.5 disabled:opacity-50">
              {closing ? "Closing…" : "Close Case"}
            </button>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          ChemoSense — Clinical decision support. Not a substitute for laboratory confirmation.
        </p>
      </div>
    </>
  );
}
