import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill } from "@/components/AppShell";
import { useEffect, useState, useMemo } from "react";
import { loadCases, type ClinicalCase } from "@/lib/cases";
import { Inbox, Search, Filter } from "lucide-react";

export const Route = createFileRoute("/cases/")({
  component: () => <AppShell><Page /></AppShell>,
  head: () => ({ meta: [{ title: "Cases — ChemoSense" }] }),
});

function Page() {
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "risk">("newest");

  useEffect(() => setCases(loadCases()), []);

  const filtered = useMemo(() => {
    let result = [...cases];
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.pathogenName.toLowerCase().includes(q) ||
        c.doctor.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.biomarkerName.toLowerCase().includes(q)
      );
    }
    // Risk filter
    if (riskFilter !== "All") {
      result = result.filter(c => c.riskLevel === riskFilter);
    }
    // Sort
    if (sortBy === "newest") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sortBy === "oldest") result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (sortBy === "risk") {
      const order: Record<string, number> = { Critical: 0, High: 1, Moderate: 2, Low: 3 };
      result.sort((a, b) => (order[a.riskLevel] ?? 9) - (order[b.riskLevel] ?? 9));
    }
    return result;
  }, [cases, search, riskFilter, sortBy]);

  return (
    <>
      <PageHeader title="Case history" subtitle={`${filtered.length} of ${cases.length} case${cases.length === 1 ? "" : "s"}`} />
      <div className="px-6 py-6 space-y-4">

        {/* Search and filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by pathogen, doctor, case ID..."
              className="w-full h-9 pl-9 pr-3 text-sm border border-input rounded-md bg-background"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="size-3.5 text-muted-foreground" />
            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}
              className="h-9 px-3 text-xs border border-input rounded-md bg-background">
              <option>All</option>
              <option>Critical</option>
              <option>High</option>
              <option>Moderate</option>
              <option>Low</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 px-3 text-xs border border-input rounded-md bg-background">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="risk">By risk level</option>
            </select>
          </div>
        </div>

        {cases.length === 0 ? (
          <div className="clinical-card p-10 text-center">
            <Inbox className="size-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">No cases yet.</p>
            <Link to="/scan" className="inline-block mt-4 h-9 px-4 leading-9 rounded-md bg-primary text-primary-foreground text-xs font-medium">Run a scan</Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="clinical-card p-10 text-center">
            <Search className="size-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">No cases match your search.</p>
            <button onClick={() => { setSearch(""); setRiskFilter("All"); }}
              className="inline-block mt-4 h-9 px-4 leading-9 rounded-md border border-border text-xs font-medium">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="clinical-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted">
                <tr>
                  <th className="text-left px-4 py-3">Case ID</th>
                  <th className="text-left px-4 py-3">Pathogen</th>
                  <th className="text-left px-4 py-3">Risk</th>
                  <th className="text-left px-4 py-3">Doctor</th>
                  <th className="text-left px-4 py-3">Biomarker</th>
                  <th className="text-left px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link to="/cases/$id" params={{ id: c.id }} className="text-primary hover:underline">{c.id}</Link>
                    </td>
                    <td className="px-4 py-3 italic">{c.pathogenName}</td>
                    <td className="px-4 py-3"><RiskPill level={c.riskLevel} /></td>
                    <td className="px-4 py-3 text-xs">{c.doctor}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.biomarkerName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
