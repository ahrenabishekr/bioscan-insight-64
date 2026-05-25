import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Activity, LayoutDashboard, ScanLine, FlaskConical, Cpu, GitCompare, Inbox, TrendingUp, BarChart2 } from "lucide-react";
import { getSession, clearSession } from "@/lib/auth";
import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import { applyTheme, getTheme, type Theme } from "@/lib/theme";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/scan", label: "Scan", icon: ScanLine },
  { to: "/library", label: "Pathogens", icon: BookOpen },
  { to: "/sensors", label: "Sensors", icon: Cpu },
  { to: "/simulator", label: "Simulator", icon: Activity },
  { to: "/compare", label: "Compare", icon: GitCompare },
  { to: "/cases", label: "Cases", icon: Inbox },
  { to: "/history", label: "History", icon: TrendingUp },
  { to: "/analytics", label: "Analytics", icon: BarChart2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const s = getSession();
    if (!s) navigate({ to: "/login" });
    setUser(s);
    const t = getTheme();
    setTheme(t);
    applyTheme(t);
  }, [navigate]);

  if (!user) return null;

  function toggleTheme() {
    const t: Theme = theme === "light" ? "dark" : "light";
    setTheme(t);
    applyTheme(t);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-60 shrink-0 border-r border-border flex-col no-print">
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-primary grid place-items-center text-primary-foreground font-mono text-xs font-bold">CS</div>
            <div>
              <div className="font-semibold text-sm leading-tight">ChemoSense</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Clinical Diagnostics</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-3">
          {nav.map((n) => {
            const active = path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors border-l-2 ${
                  active
                    ? "border-primary bg-primary-muted text-primary font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <n.icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <Link to="/settings" className="block hover:opacity-80">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full gradient-primary text-primary-foreground grid place-items-center text-[11px] font-semibold">
                {user.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{user.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{user.role}{user.department ? ` · ${user.department}` : ""}</div>
              </div>
            </div>
          </Link>
          <div className="mt-3 flex items-center gap-1">
            <Link to="/settings" className="flex-1 h-7 px-2 text-[11px] inline-flex items-center gap-1 text-muted-foreground hover:text-foreground rounded border border-border">
              <Settings className="size-3" /> Settings
            </Link>
            <button onClick={toggleTheme} title="Toggle theme" className="size-7 grid place-items-center text-muted-foreground hover:text-foreground rounded border border-border">
              {theme === "dark" ? <Sun className="size-3" /> : <Moon className="size-3" />}
            </button>
          </div>
          <button
            onClick={() => {
              clearSession();
              navigate({ to: "/login" });
            }}
            className="mt-2 text-[11px] flex items-center gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="size-3" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden border-b border-border px-4 h-12 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-primary grid place-items-center text-primary-foreground font-mono text-[10px] font-bold">CS</div>
            <span className="font-semibold text-sm">ChemoSense</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="size-7 grid place-items-center text-muted-foreground">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <Link to="/settings" className="size-7 grid place-items-center text-muted-foreground"><Settings className="size-4" /></Link>
          </div>
        </header>
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        {/* Bottom tabs (mobile) */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-background border-t border-border grid grid-cols-5 no-print z-40">
          {nav.slice(0, 5).map((n) => {
            const active = path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <n.icon className="size-5" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="border-b border-border px-6 py-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function RiskPill({ level }: { level: string }) {
  const map: Record<string, string> = {
    Critical: "bg-destructive/10 text-destructive border-destructive/30",
    High: "bg-amber-50 text-amber-700 border-amber-300",
    Moderate: "bg-blue-50 text-blue-700 border-blue-300",
    Low: "bg-emerald-50 text-emerald-700 border-emerald-300",
  };
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded border ${map[level] ?? ""}`}>
      {level}
    </span>
  );
}

export function LabRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <dl className="lab-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </dl>
  );
}