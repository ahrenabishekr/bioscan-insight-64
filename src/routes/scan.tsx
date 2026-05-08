import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill } from "@/components/AppShell";
import { useState } from "react";
import { matchSymptoms, matchByBiomarker, allBiomarkerNames, type MatchResult } from "@/lib/match";
import { buildCase, saveCase } from "@/lib/cases";
import { getSession } from "@/lib/auth";
import { ScanLine, Loader2, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/scan")({
  component: () => <AppShell><Page /></AppShell>,
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : "" }),
  head: () => ({ meta: [{ title: "Clinical scan — ChemoSense" }] }),
});

function Page() {
  const { q: q0 } = useSearch({ from: "/scan" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<"symptom" | "biomarker">("symptom");
  const [text, setText] = useState(q0 ?? "");
  const [bio, setBio] = useState<string>(allBiomarkerNames()[0]);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);

  function runScan() {
    setScanning(true);
    setResults([]);
    setTimeout(() => {
      const r = mode === "symptom" ? matchSymptoms(text) : matchByBiomarker(bio);
      setResults(r);
      setScanning(false);
    }, 900);
  }

  function persist(r: MatchResult) {
    const u = getSession();
    const c = buildCase({
      doctor: u?.name ?? "Unknown",
      mode,
      input: mode === "symptom" ? text : bio,
      pathogen: r.pathogen,
      biomarker: r.topBiomarker,
    });
    saveCase(c);
    navigate({ to: "/cases/$id", params: { id: c.id } });
  }

  return (
    <>
      <PageHeader title="Clinical scan" subtitle="Identify likely pathogen from symptoms or detected biomarker." />
      <div className="px-6 py-6 max-w-4xl">
        <div className="clinical-card p-1 inline-flex">
          {(["symptom", "biomarker"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 h-9 text-xs font-medium rounded-md ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {m === "symptom" ? "Mode A · Symptoms" : "Mode B · Biomarker"}
            </button>
          ))}
        </div>

        <div className="clinical-card p-5 mt-4">
          {mode === "symptom" ? (
            <>
              <label className="text-xs font-medium">Clinical picture</label>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4}
                placeholder="e.g. Burn-wound patient, green pus with fruity odour, ICU day 4, ventilated."
                className="mt-1 w-full p-3 text-sm border border-input rounded-md bg-background" />
            </>
          ) : (
            <>
              <label className="text-xs font-medium">Detected biomarker</label>
              <select value={bio} onChange={(e) => setBio(e.target.value)}
                className="mt-1 w-full h-10 px-3 text-sm border border-input rounded-md bg-background">
                {allBiomarkerNames().map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </>
          )}
          <button onClick={runScan} disabled={scanning || (mode === "symptom" && !text.trim())}
            className="mt-4 h-10 px-4 rounded-md gradient-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50 shadow-elegant">
            {scanning ? <><Loader2 className="size-4 animate-spin" /> Scanning…</> : <><ScanLine className="size-4" /> Run scan</>}
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><FlaskConical className="size-4 text-primary" /> Results</h2>
            <div className="space-y-3">
              {results.map((r) => (
                <div key={r.pathogen.id} className="clinical-card p-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold italic">{r.pathogen.name}</span>
                      <RiskPill level={r.pathogen.riskLevel} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Match score: <span className="font-mono">{r.score}</span>
                      {r.matched.length > 0 && <> · keywords: {r.matched.join(", ")}</>}
                    </div>
                    <div className="text-xs mt-2">
                      Recommended biomarker: <strong>{r.topBiomarker.name}</strong> · LOD {r.topBiomarker.lod} · {r.topBiomarker.detectionTime}
                    </div>
                  </div>
                  <button onClick={() => persist(r)} className="h-9 px-3 text-xs rounded-md bg-primary text-primary-foreground font-medium whitespace-nowrap">
                    Generate report
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!scanning && results.length === 0 && (text.trim() || mode === "biomarker") === false && (
          <p className="mt-4 text-xs text-muted-foreground">Enter a clinical picture above, then run scan.</p>
        )}
      </div>
    </>
  );
}
