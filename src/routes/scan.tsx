import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill } from "@/components/AppShell";
import { useState, useEffect } from "react";
import { getSession } from "@/lib/auth";
import { ScanLine, Loader2, FlaskConical, ArrowRight } from "lucide-react";

const API_URL = "https://chemosense-backend.onrender.com/api";

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
            <div className="space-y-4">
              {results.map((r, idx) => {
                const riskBorder = r.pathogen.riskLevel === "Critical" ? "border-t-destructive" : r.pathogen.riskLevel === "High" ? "border-t-amber-400" : "border-t-blue-400";
                const riskBg = r.pathogen.riskLevel === "Critical" ? "bg-destructive/5" : r.pathogen.riskLevel === "High" ? "bg-amber-50/50" : "bg-blue-50/30";
                const matchPct = Math.min(100, Math.round((r.score / 10) * 100));
                return (
                <div key={r.pathogen.id} className={`clinical-card overflow-hidden border-t-4 ${riskBorder}`}>
                  {/* Header */}
                  <div className={`px-5 pt-4 pb-3 ${riskBg}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {idx === 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">TOP MATCH</span>}
                          <RiskPill level={r.pathogen.riskLevel} />
                        </div>
                        <div className="text-xl font-bold italic mt-1">{r.pathogen.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{r.pathogen.gram}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-muted-foreground">Match confidence</div>
                        <div className="text-2xl font-bold text-primary">{matchPct}%</div>
                        <div className="h-1.5 w-16 bg-muted rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{width: `${matchPct}%`}} />
                        </div>
                      </div>
                    </div>
                    {r.matched?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {r.matched.map((kw: string) => (
                          <span key={kw} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{kw}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Biomarker strip */}
                  <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Recommended Biomarker</div>
                      <div className="text-sm font-semibold mt-0.5">{r.topBiomarker?.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">LOD</div>
                      <div className="text-xs font-mono text-primary font-bold">{r.topBiomarker?.lod}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Detection</div>
                      <div className="text-xs font-medium">{r.topBiomarker?.detectionTime}</div>
                    </div>
                  </div>

                  {/* Summary + Treatment */}
                  <div className="px-5 py-3 border-t border-border">
                    <p className="text-xs text-muted-foreground leading-relaxed">{r.pathogen.summary}</p>
                    <div className="mt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Empirical Treatment</p>
                      <div className="flex flex-wrap gap-1.5">
                        {r.pathogen.empiricalTreatment?.slice(0,3).map((t: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">QS: <span className="font-medium text-foreground">{r.pathogen.qsSystem?.name}</span></span>
                    <button onClick={() => generateReport(r)} disabled={saving === r.pathogen.id}
                      className="h-9 px-4 text-xs rounded-md bg-primary text-primary-foreground font-medium inline-flex items-center gap-1.5 disabled:opacity-60 shadow-elegant">
                      {saving === r.pathogen.id
                        ? <><Loader2 className="size-3 animate-spin" /> Saving…</>
                        : <><ArrowRight className="size-3" /> Generate report</>}
                    </button>
                  </div>
                </div>
                );
              })}
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
