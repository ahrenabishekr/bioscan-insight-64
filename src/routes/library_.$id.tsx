import { createFileRoute, useParams, Link, notFound } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill, LabRow } from "@/components/AppShell";
import { findPathogen } from "@/data/pathogens";
import { findSensor } from "@/data/sensors";
import { apiFetch } from "@/lib/apiClient";
import { useState } from "react";
import { ChevronLeft, Sparkles, Loader2, Send } from "lucide-react";

export const Route = createFileRoute("/library_/$id")({
  component: () => <AppShell><Page /></AppShell>,
  loader: ({ params }) => {
    const p = findPathogen(params.id);
    if (!p) throw notFound();
    return p;
  },
  notFoundComponent: () => <AppShell><div className="p-6 text-sm">Pathogen not found. <Link to="/library" className="text-primary">Back to library</Link>.</div></AppShell>,
  head: () => ({ meta: [{ title: "Pathogen — ChemoSense" }] }),
});

type QAEntry = { question: string; answer: string; source: "ai" | "fallback" };

function Page() {
  const { id } = useParams({ from: "/library_/$id" });
  const p = findPathogen(id)!;

  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [history, setHistory] = useState<QAEntry[]>([]);

  const handleAsk = async () => {
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true);
    try {
      const res = await apiFetch(`https://chemosense-backend.onrender.com/api/pathogens/${id}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, pathogen: p }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setHistory((h) => [...h, { question: q, answer: data.answer, source: data.source }]);
      setQuestion("");
    } catch {
      setHistory((h) => [...h, { question: q, answer: "Couldn't get an answer right now — please try again.", source: "fallback" }]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <>
      <PageHeader
        title={p.name}
        subtitle={<><span>{p.gram}</span> · {p.summary}</> as unknown as string}
        actions={<Link to="/library" className="h-9 px-3 text-xs border border-border rounded-md inline-flex items-center gap-1.5 hover:bg-muted"><ChevronLeft className="size-3.5" /> Library</Link>}
      />
      <div className="px-6 py-6 max-w-4xl space-y-5">
        <div className="clinical-card p-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Risk classification</div>
            <div className="text-base mt-1">{p.infectionSites.join(" · ")}</div>
          </div>
          <RiskPill level={p.riskLevel} />
        </div>

        {/* Ask AI */}
        <div className="clinical-card overflow-hidden border-l-4 border-l-violet-400">
          <div className="px-5 py-3 border-b border-border bg-violet-50/50 flex items-center gap-2">
            <Sparkles className="size-4 text-violet-500" />
            <h2 className="text-sm font-semibold">Ask AI about {p.shortName}</h2>
          </div>
          <div className="p-5 space-y-4">
            {history.map((entry, i) => (
              <div key={i} className="text-sm space-y-1.5">
                <div className="font-medium text-xs text-muted-foreground">Q: {entry.question}</div>
                <div className="leading-relaxed pl-3 border-l-2 border-violet-200">{entry.answer}</div>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAsk(); }}
                placeholder="e.g. How urgent is empirical treatment if this is suspected?"
                className="flex-1 h-10 border border-input rounded-md px-3 text-sm bg-background"
                disabled={asking}
              />
              <button
                onClick={handleAsk}
                disabled={asking || !question.trim()}
                className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {asking ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                Ask
              </button>
            </div>
          </div>
        </div>

        <div className="clinical-card p-5">
          <h2 className="text-sm font-semibold mb-2">Quorum sensing</h2>
          <dl>
            <LabRow label="QS system">{p.qsSystem.name}</LabRow>
            <LabRow label="Molecules">{p.qsSystem.molecules.join(", ")}</LabRow>
            <LabRow label="Clinical note">{p.qsSystem.clinicalNote}</LabRow>
          </dl>
        </div>

        <div className="clinical-card p-5">
          <h2 className="text-sm font-semibold mb-3">Biomarkers ({p.biomarkers.length})</h2>
          <div className="space-y-3">
            {p.biomarkers.map((b) => {
              const s = findSensor(b.recommendedSensor);
              return (
                <div key={b.name} className="border border-border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{b.name} <span className="text-[11px] text-muted-foreground">({b.type})</span></div>
                    <span className="text-[11px] font-mono text-primary">{s?.shortName}</span>
                  </div>
                  <dl className="mt-2">
                    <LabRow label="LOD">{b.lod}</LabRow>
                    <LabRow label="Detection time">{b.detectionTime}</LabRow>
                    <LabRow label="Mechanism">{b.mechanism}</LabRow>
                    <LabRow label="Clinical meaning">{b.clinicalMeaning}</LabRow>
                  </dl>
                </div>
              );
            })}
          </div>
        </div>

        <div className="clinical-card p-5">
          <h2 className="text-sm font-semibold mb-2">AMR genes</h2>
          <table className="w-full text-xs">
            <thead className="text-muted-foreground border-b border-border"><tr><th className="text-left py-2 pr-4">Gene</th><th className="text-left py-2">Resistance</th></tr></thead>
            <tbody>
              {p.amrGenes.map((g) => (
                <tr key={g.gene} className="border-b border-border last:border-0">
                  <td className="py-2 pr-4 font-mono">{g.gene}</td><td className="py-2">{g.resistance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="clinical-card p-5">
          <h2 className="text-sm font-semibold mb-2">Empirical treatment</h2>
          <ol className="text-sm space-y-1.5 list-decimal list-inside">{p.empiricalTreatment.map((t) => <li key={t}>{t}</li>)}</ol>
        </div>
      </div>
    </>
  );
}
