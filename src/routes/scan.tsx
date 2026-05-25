import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill } from "@/components/AppShell";
import { useState, useEffect } from "react";
import { getSession } from "@/lib/auth";
import { ScanLine, Loader2, FlaskConical, ArrowRight } from "lucide-react";

const API_URL = "https://chemosense-backend-production.up.railway.app/api";

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
  const [bio, setBio] = useState<string>("");
  const [biomarkers, setBiomarkers] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/scan/biomarkers`)
      .then((r) => r.json())
      .then((data) => { setBiomarkers(data); if (data.length > 0) setBio(data[0]); })
      .catch(() => setBiomarkers([]));
  }, []);

  async function runScan() {
    setScanning(true);
    setResults([]);
    setError("");
    try {
      let res;
      if (mode === "symptom") {
        res = await fetch(`${API_URL}/scan/symptoms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
      } else {
        res = await fetch(`${API_URL}/scan/biomarker`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ biomarker: bio }),
        });
      }
      const data = await res.json();
      setResults(data);
    } catch {
      setError("Scan failed. Check your connection.");
    } finally {
      setScanning(false);
    }
  }

  async function generateReport(r: any) {
    const u = getSession();
    setSaving(r.pathogen.id);
    try {
      const res = await fetch(`${API_URL}/scans/full`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: `CS-${Date.now().toString(36).toUpperCase()}`,
          pathogen_name: r.pathogen.name,
          biomarker_name: r.topBiomarker?.name ?? mode === "biomarker" ? bio : r.topBiomarker?.name,
          risk_level: r.pathogen.riskLevel,
          scanned_by: u?.name ?? "Unknown",
          result: "positive",
          notes: mode === "symptom" ? text : bio,
        }),
      });
      const data = await res.json();
      if (data.case_id) {
        navigate({ to: "/cases/$id", params: { id: String(data.case_id) } });
      }
    } catch {
      setError("Failed to save scan. Try again.");
    } finally {
      setSaving(null);
    }
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
                {biomarkers.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </>
          )}

          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

          <button onClick={runScan} disabled={scanning || (mode === "symptom" && !text.trim())}
            className="mt-4 h-10 px-4 rounded-md gradient-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50 shadow-elegant">
            {scanning ? <><Loader2 className="size-4 animate-spin" /> Scanning…</> : <><ScanLine className="size-4" /> Run scan</>}
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FlaskConical className="size-4 text-primary" /> Results ({results.length} pathogen{results.length > 1 ? "s" : ""} matched)
            </h2>
            <div className="space-y-3">
              {results.map((r) => (
                <div key={r.pathogen.id} className="clinical-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold italic">{r.pathogen.name}</span>
                        <RiskPill level={r.pathogen.riskLevel} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Match score: <span className="font-mono font-bold">{r.score}</span>
                        {r.matched?.length > 0 && <> · keywords: <span className="text-primary">{r.matched.join(", ")}</span></>}
                      </div>
                      <div className="text-xs mt-2">
                        Recommended biomarker: <strong>{r.topBiomarker?.name}</strong> · LOD {r.topBiomarker?.lod} · {r.topBiomarker?.detectionTime}
                      </div>
                      <div className="text-xs mt-1 text-muted-foreground">{r.pathogen.summary}</div>
                      <div className="mt-2">
                        <p className="text-xs font-medium">Treatment:</p>
                        <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                          {r.pathogen.empiricalTreatment?.map((t: string, i: number) => (
                            <li key={i}>• {t}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <button onClick={() => generateReport(r)} disabled={saving === r.pathogen.id}
                      className="h-9 px-3 text-xs rounded-md bg-primary text-primary-foreground font-medium whitespace-nowrap inline-flex items-center gap-1.5 disabled:opacity-60">
                      {saving === r.pathogen.id
                        ? <><Loader2 className="size-3 animate-spin" /> Saving…</>
                        : <><ArrowRight className="size-3" /> Generate report</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!scanning && results.length === 0 && !text.trim() && mode === "symptom" && (
          <p className="mt-4 text-xs text-muted-foreground">Enter a clinical picture above, then run scan.</p>
        )}
      </div>
    </>
  );
}
