import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill } from "@/components/AppShell";
import { pathogens } from "@/data/pathogens";

export const Route = createFileRoute("/library")({
  component: () => (
    <AppShell>
      <Page />
    </AppShell>
  ),
  head: () => ({ meta: [{ title: "Pathogen library — ChemoSense" }] }),
});

function Page() {
  return (
    <>
      <PageHeader title="Pathogen library" subtitle="Clinical reference for the 5 priority pathogens." />
      <div className="px-6 py-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pathogens.map((p) => (
          <Link
            key={p.id}
            to="/library/$id"
            params={{ id: p.id }}
            className="clinical-card p-5 hover:border-primary transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-base font-semibold italic">{p.shortName}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{p.gram}</div>
              </div>
              <RiskPill level={p.riskLevel} />
            </div>
            <p className="text-xs text-muted-foreground mt-3 line-clamp-3">{p.summary}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
              <Stat n={p.biomarkers.length} l="Biomarkers" />
              <Stat n={p.amrGenes.length} l="AMR genes" />
              <Stat n={p.infectionSites.length} l="Sites" />
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="border border-border rounded-md p-2">
      <div className="text-base font-semibold font-mono">{n}</div>
      <div className="text-muted-foreground">{l}</div>
    </div>
  );
}