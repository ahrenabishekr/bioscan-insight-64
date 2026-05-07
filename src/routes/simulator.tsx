import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useMemo, useState } from "react";
import { pathogens } from "@/data/pathogens";
import { findSensor } from "@/data/sensors";

export const Route = createFileRoute("/simulator")({
  component: () => (
    <AppShell>
      <Page />
    </AppShell>
  ),
  head: () => ({ meta: [{ title: "Signal simulator — ChemoSense" }] }),
});

function Page() {
  const [pid, setPid] = useState(pathogens[0].id);
  const [logCfu, setLogCfu] = useState(5); // log10 CFU/mL
  const p = pathogens.find((x) => x.id === pid)!;
  const b = p.biomarkers[0];
  const s = findSensor(b.recommendedSensor)!;

  // sigmoid: response% = 100 / (1 + exp(-k(x - x0))); LOD threshold ~10%
  const x0 = 5; // mid-point in log CFU/mL
  const k = 1.6;
  const points = useMemo(() => {
    const arr: { x: number; y: number }[] = [];
    for (let x = 1; x <= 9; x += 0.1) {
      const y = 100 / (1 + Math.exp(-k * (x - x0)));
      arr.push({ x, y });
    }
    return arr;
  }, []);
  const current = 100 / (1 + Math.exp(-k * (logCfu - x0)));
  const status =
    current < 10 ? { label: "Below LOD", cls: "text-muted-foreground" }
    : current < 90 ? { label: "Detection range", cls: "text-primary" }
    : { label: "Saturation", cls: "text-amber-700" };

  // SVG path
  const w = 600, h = 240, pad = 36;
  const xScale = (x: number) => pad + ((x - 1) / 8) * (w - pad * 2);
  const yScale = (y: number) => h - pad - (y / 100) * (h - pad * 2);
  const path = points.map((p, i) => `${i ? "L" : "M"}${xScale(p.x).toFixed(1)},${yScale(p.y).toFixed(1)}`).join(" ");

  return (
    <>
      <PageHeader title="Signal simulator" subtitle="Watch the chemosensor sigmoid response in real time." />
      <div className="px-6 py-6 max-w-4xl">
        <div className="clinical-card p-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium">Pathogen</span>
              <select value={pid} onChange={(e) => setPid(e.target.value)} className="mt-1 w-full h-10 border border-input rounded-md px-2 text-sm">
                {pathogens.map((x) => <option key={x.id} value={x.id}>{x.shortName} — {x.biomarkers[0].name}</option>)}
              </select>
            </label>
            <div>
              <span className="text-xs font-medium">Sensor</span>
              <div className="mt-1 h-10 px-3 flex items-center text-sm border border-border rounded-md bg-muted">{s.name}</div>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">Bacterial concentration</span>
              <span className="font-mono">10<sup>{logCfu.toFixed(1)}</sup> CFU/mL</span>
            </div>
            <input type="range" min={1} max={9} step={0.1} value={logCfu} onChange={(e) => setLogCfu(parseFloat(e.target.value))} className="mt-2 w-full accent-primary" />
          </div>

          <div className="mt-5 border border-border rounded-md p-3 bg-white">
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
              {/* axes */}
              <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="currentColor" strokeOpacity=".15" />
              <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="currentColor" strokeOpacity=".15" />
              {/* LOD line */}
              <line x1={pad} y1={yScale(10)} x2={w - pad} y2={yScale(10)} stroke="oklch(0.72 0.16 75)" strokeDasharray="4 4" strokeWidth="1" />
              <text x={w - pad} y={yScale(10) - 4} textAnchor="end" fontSize="10" fill="oklch(0.55 0.13 75)">LOD</text>
              {/* curve */}
              <path d={path} fill="none" stroke="oklch(0.46 0.09 195)" strokeWidth="2" />
              {/* current point */}
              <circle cx={xScale(logCfu)} cy={yScale(current)} r="5" fill="oklch(0.46 0.09 195)" />
              <line x1={xScale(logCfu)} y1={h - pad} x2={xScale(logCfu)} y2={yScale(current)} stroke="oklch(0.46 0.09 195)" strokeOpacity=".3" />
              {/* x labels */}
              {[1,3,5,7,9].map((v) => (
                <text key={v} x={xScale(v)} y={h - pad + 14} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity=".6">10^{v}</text>
              ))}
              <text x={w / 2} y={h - 4} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity=".6">CFU/mL</text>
              <text x={12} y={pad - 6} fontSize="10" fill="currentColor" fillOpacity=".6">Signal %</text>
            </svg>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
            <Stat label="Signal" v={`${current.toFixed(1)}%`} />
            <Stat label="Status" v={status.label} cls={status.cls} />
            <Stat label="Target" v={b.name} />
          </div>

          <p className="mt-4 text-[11px] text-muted-foreground">
            Sigmoid response models chemosensor saturation kinetics. Below 10 % the signal is indistinguishable from baseline noise (LOD).
            The detection window for {s.shortName} on {b.name} is approximately 10<sup>3</sup>–10<sup>7</sup> CFU/mL.
          </p>
        </div>
      </div>
    </>
  );
}

function Stat({ label, v, cls }: { label: string; v: string; cls?: string }) {
  return (
    <div className="border border-border rounded-md p-3">
      <div className="text-muted-foreground text-[11px]">{label}</div>
      <div className={`mt-1 font-mono text-sm ${cls ?? ""}`}>{v}</div>
    </div>
  );
}