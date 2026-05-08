import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { loadCases, type ClinicalCase } from "@/lib/cases";
import { pathogens } from "@/data/pathogens";
import { ScanLine, BookOpen, Cpu } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: () => (<AppShell><DashboardPage /></AppShell>),
  head: () => ({ meta: [{ title: "Dashboard — ChemoSense" }] }),
});

function DashboardPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => setCases(loadCases()), []);
  const today = useMemo(() => new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }), []);

  return (
    <>
      <PageHeader title="Dashboard" subtitle={today}
        actions={<Link to="/scan" className="hidden md:inline-flex h-9 px-3 items-center text-sm rounded-md bg-primary text-primary-foreground font-medium"><ScanLine className="size-4 mr-1.5" /> New scan</Link>} />
      <div className="px-6 py-6 grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 clinical-card p-5">
          <h2 className="text-sm font-semibold">Quick scan</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Type the clinical picture or select a detected biomarker.</p>
          <form onSubmit={(e) => { e.preventDefault(); navigate({ to: "/scan", search: { q } as never }); }} className="mt-3 flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. burn wound, green pus, fruity odour" className="flex-1 h-10 px-3 border border-input rounded-md text-sm" />
            <button className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Scan</button>
          </form>
          <div className="mt-6">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">5 most common pathogens</h3>
            <div className="mt-3 grid sm:grid-cols-2 gap-2">
              {pathogens.slice(0, 6).map((p) => (
                <Link key={p.id} to="/library/$id" params={{ id: p.id }} className="flex items-center justify-between p-3 border border-border rounded-md hover:border-primary transition-colors">
                  <div>
                    <div className="text-sm font-medium italic">{p.shortName}</div>
                    <div className="text-[11px] text-muted-foreground">{p.gram} • {p.biomarkers.length} biomarkers</div>
                  </div>
                  <RiskPill level={p.riskLevel} />
                </Link>
              ))}
            </div>
          </div>
        </section>
        <aside className="clinical-card p-5">
          <h2 className="text-sm font-semibold">Last 3 cases</h2>
          {cases.length === 0 ? (
            <p className="text-xs text-muted-foreground mt-3">No cases yet. Run your first scan.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {cases.slice(0, 3).map((c) => (
                <li key={c.id} className="py-3">
                  <Link to="/cases/$id" params={{ id: c.id }} className="block">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted-foreground">{c.id}</span>
                      <RiskPill level={c.riskLevel} />
                    </div>
                    <div className="text-sm font-medium italic mt-1">{c.pathogenName}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link to="/library" className="text-xs flex items-center gap-1.5 px-3 h-9 border border-border rounded-md hover:bg-muted"><BookOpen className="size-3.5" /> Library</Link>
            <Link to="/sensors" className="text-xs flex items-center gap-1.5 px-3 h-9 border border-border rounded-md hover:bg-muted"><Cpu className="size-3.5" /> Sensors</Link>
          </div>
        </aside>
      </div>
    </>
  );
}