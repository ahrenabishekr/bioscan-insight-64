import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader, RiskPill } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { loadCases, type ClinicalCase } from "@/lib/cases";
import { pathogens } from "@/data/pathogens";
import { ScanLine, BookOpen, Cpu, Activity, FlaskConical, Users, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const API_URL = "https://chemosense-backend-production.up.railway.app/api";

export const Route = createFileRoute("/dashboard")({
  component: () => (<AppShell><DashboardPage /></AppShell>),
  head: () => ({ meta: [{ title: "Dashboard — ChemoSense" }] }),
});

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <div className="clinical-card p-5 flex items-center gap-4">
      <div className={`size-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="size-5 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}

const COLORS = ["#0d9488", "#0891b2", "#7c3aed", "#dc2626", "#d97706", "#059669"];

function DashboardPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [q, setQ] = useState("");
  const [stats, setStats] = useState({ total_scans: 0, total_cases: 0, active_sensors: 0, open_cases: 0, recent_scans: [] });
  const [dbCases, setDbCases] = useState<any[]>([]);
  const today = useMemo(() => new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }), []);

  useEffect(() => {
    setCases(loadCases());
    // Load real stats from backend
    fetch(`${API_URL}/dashboard`)
      .then(r => r.json())
      .then(setStats)
      .catch(console.error);
    // Load real cases from backend
    fetch(`${API_URL}/cases`)
      .then(r => r.json())
      .then(setDbCases)
      .catch(console.error);
  }, []);

  // Pathogen frequency chart data
  const pathogenData = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach(c => {
      counts[c.pathogenName] = (counts[c.pathogenName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name: name.split(" ")[0], count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [cases]);

  // Risk level pie chart
  const riskData = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach(c => {
      counts[c.riskLevel] = (counts[c.riskLevel] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [cases]);

  return (
    <>
      <PageHeader title="Dashboard" subtitle={today}
        actions={<Link to="/scan" className="hidden md:inline-flex h-9 px-3 items-center text-sm rounded-md bg-primary text-primary-foreground font-medium"><ScanLine className="size-4 mr-1.5" /> New scan</Link>} />

      <div className="px-6 py-6 space-y-6">

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FlaskConical} label="Total Scans" value={stats.total_scans} color="bg-teal-500" />
          <StatCard icon={Activity} label="Total Cases" value={stats.total_cases} color="bg-blue-500" />
          <StatCard icon={Cpu} label="Active Sensors" value={stats.active_sensors} color="bg-violet-500" />
          <StatCard icon={AlertTriangle} label="Open Cases" value={stats.open_cases} color="bg-red-500" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Quick scan */}
          <section className="lg:col-span-2 space-y-6">
            <div className="clinical-card p-5">
              <h2 className="text-sm font-semibold">Quick scan</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Type the clinical picture or select a detected biomarker.</p>
              <form onSubmit={(e) => { e.preventDefault(); navigate({ to: "/scan", search: { q } as never }); }} className="mt-3 flex gap-2">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. burn wound, green pus, fruity odour" className="flex-1 h-10 px-3 border border-input rounded-md text-sm" />
                <button className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Scan</button>
              </form>
            </div>

            {/* Pathogen frequency chart */}
            {pathogenData.length > 0 && (
              <div className="clinical-card p-5">
                <h2 className="text-sm font-semibold mb-4">Pathogen Frequency</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={pathogenData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Common pathogens */}
            <div className="clinical-card p-5">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Common Pathogens</h3>
              <div className="grid sm:grid-cols-2 gap-2">
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

          {/* Right sidebar */}
          <aside className="space-y-4">

            {/* Risk pie chart */}
            {riskData.length > 0 && (
              <div className="clinical-card p-5">
                <h2 className="text-sm font-semibold mb-2">Risk Distribution</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={riskData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {riskData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Last 3 cases */}
            <div className="clinical-card p-5">
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
            </div>

          </aside>
        </div>
      </div>
    </>
  );
}
