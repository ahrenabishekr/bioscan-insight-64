import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { sensors } from "@/data/sensors";
import { Cpu } from "lucide-react";

export const Route = createFileRoute("/sensors")({
  component: () => <AppShell><Page /></AppShell>,
  head: () => ({ meta: [{ title: "Sensor reference — ChemoSense" }] }),
});

function Page() {
  return (
    <>
      <PageHeader title="Sensor reference" subtitle="Five chemosensor platforms used in ChemoSense." />
      <div className="px-6 py-6 grid lg:grid-cols-2 gap-4">
        {sensors.map((s) => (
          <div key={s.id} className="clinical-card p-5">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-md bg-primary-muted text-primary grid place-items-center"><Cpu className="size-4" /></div>
              <div className="flex-1">
                <div className="text-base font-semibold">{s.name}</div>
                <div className="text-[11px] text-muted-foreground">Detects: {s.detects.join(" · ")}</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">{s.howItWorks}</p>
            <dl className="mt-4">
              <Row k="Equipment" v={s.equipment} />
              <Row k="LOD range" v={s.lodRange} />
              <Row k="Detection time" v={s.detectionTime} />
              <Row k="Cost / test" v={s.costPerTest} />
              <Row k="Reusability" v={s.reusability} />
              <Row k="Best samples" v={s.bestSamples.join(", ")} />
            </dl>
            <div className="grid grid-cols-2 gap-3 mt-3 text-[11px]">
              <div>
                <div className="text-muted-foreground">Pros</div>
                <ul className="mt-1 space-y-0.5">{s.pros.map((p) => <li key={p}>+ {p}</li>)}</ul>
              </div>
              <div>
                <div className="text-muted-foreground">Cons</div>
                <ul className="mt-1 space-y-0.5">{s.cons.map((p) => <li key={p}>− {p}</li>)}</ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 py-1.5 border-b border-border text-xs last:border-0">
      <dt className="text-muted-foreground">{k}</dt><dd>{v}</dd>
    </div>
  );
}
