import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { loadCases, type ClinicalCase } from "@/lib/cases";
import { Inbox } from "lucide-react";

export const Route = createFileRoute("/cases/")({
  component: () => <AppShell><Page /></AppShell>,
  head: () => ({ meta: [{ title: "Cases — ChemoSense" }] }),
});

function Page() {
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  useEffect(() => setCases(loadCases()), []);
  return (
    <>
      <PageHeader title="Case history" subtitle={`${cases.length} saved case${cases.length === 1 ? "" : "s"}`} />
      <div className="px-6 py-6">
        {cases.length === 0 ? (
          <div className="clinical-card p-10 text-center">
            <Inbox className="size-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">No cases yet.</p>
            <Link to="/scan" className="inline-block mt-4 h-9 px-4 leading-9 rounded-md bg-primary text-primary-foreground text-xs font-medium">Run a scan</Link>
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
                  <th className="text-left px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-4 py-3 font-mono text-xs"><Link to="/cases/$id" params={{ id: c.id }} className="text-primary">{c.id}</Link></td>
                    <td className="px-4 py-3 italic">{c.pathogenName}</td>
                    <td className="px-4 py-3"><RiskPill level={c.riskLevel} /></td>
                    <td className="px-4 py-3 text-xs">{c.doctor}</td>
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
