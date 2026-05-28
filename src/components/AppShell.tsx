import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Activity, LayoutDashboard, ScanLine, FlaskConical, Cpu, GitCompare, Inbox, TrendingUp, BarChart2, BookOpen, Settings, Sun, Moon, LogOut, Bell, Users, Menu, X, ChevronRight, Biohazard } from "lucide-react";
import { getSession, clearSession } from "@/lib/auth";
import { useEffect, useState, useCallback } from "react";
import type { SessionUser } from "@/lib/auth";
import { applyTheme, getTheme, type Theme } from "@/lib/theme";

const API_URL = "https://chemosense-backend-production.up.railway.app/api";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/scan", label: "Scan", icon: ScanLine },
  { to: "/library", label: "Pathogens", icon: BookOpen },
  { to: "/sensors", label: "Sensors", icon: Cpu },
  { to: "/simulator", label: "Simulator", icon: Activity },
  { to: "/compare", label: "Compare", icon: GitCompare },
  { to: "/cases", label: "Cases", icon: Inbox },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/history", label: "History", icon: TrendingUp },
  { to: "/analytics", label: "Analytics", icon: BarChart2 },
  { to: "/outbreaks", label: "Outbreaks", icon: Biohazard },
];

// Bottom nav: 4 primary + More
const bottomNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/scan", label: "Scan", icon: ScanLine },
  { to: "/cases", label: "Cases", icon: Inbox },
  { to: "/alerts", label: "Alerts", icon: Bell },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [theme, setTheme] = useState<Theme>("light");
  const [unread, setUnread] = useState(0);
  const [showMore, setShowMore] = useState(false);

  const fetchUnread = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/alerts`);
      const data = await r.json();
      if (Array.isArray(data)) setUnread(data.filter((a: any) => !a.is_read).length);
    } catch {}
  }, []);

  useEffect(() => {
    const s = getSession();
    if (!s) navigate({ to: "/login" });
    setUser(s);
    const t = getTheme();
    setTheme(t);
    applyTheme(t);
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [navigate, fetchUnread]);

  // Close more drawer on navigation
  useEffect(() => { setShowMore(false); }, [path]);

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-md bg-primary grid place-items-center text-primary-foreground font-mono text-xs font-bold">CS</div>
              <div>
                <div className="font-semibold text-sm leading-tight">ChemoSense</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Clinical Diagnostics</div>
              </div>
            </div>
            <Link to="/alerts" className="relative size-7 grid place-items-center text-muted-foreground hover:text-foreground">
              <Bell className="size-4" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-destructive text-white text-[9px] font-bold grid place-items-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          </div>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {nav.map((n) => {
            const active = path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors border-l-2 ${
                  active ? "border-primary bg-primary-muted text-primary font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}>
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
          <button onClick={() => { clearSession(); navigate({ to: "/login" }); }}
            className="mt-2 text-[11px] flex items-center gap-1.5 text-muted-foreground hover:text-destructive">
            <LogOut className="size-3" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden border-b border-border px-4 h-14 flex items-center justify-between no-print bg-background sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary grid place-items-center text-primary-foreground font-mono text-xs font-bold">CS</div>
            <div>
              <div className="font-semibold text-sm leading-tight">ChemoSense</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Clinical Diagnostics</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/alerts" className="relative size-9 grid place-items-center text-muted-foreground rounded-lg hover:bg-muted">
              <Bell className="size-4" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 size-4 rounded-full bg-destructive text-white text-[9px] font-bold grid place-items-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <button onClick={toggleTheme} className="size-9 grid place-items-center text-muted-foreground rounded-lg hover:bg-muted">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <Link to="/settings" className="size-9 grid place-items-center text-muted-foreground rounded-lg hover:bg-muted">
              <Settings className="size-4" />
            </Link>
          </div>
        </header>

        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-background border-t border-border no-print z-40">
          <div className="grid grid-cols-5 h-16">
            {bottomNav.map((n) => {
              const active = path.startsWith(n.to);
              const isAlerts = n.to === "/alerts";
              return (
                <Link key={n.to} to={n.to}
                  className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors relative ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}>
                  <div className="relative">
                    <n.icon className="size-5" />
                    {isAlerts && unread > 0 && (
                      <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-destructive text-white text-[8px] font-bold grid place-items-center">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </div>
                  {n.label}
                  {active && <span className="absolute top-0 inset-x-0 h-0.5 bg-primary rounded-b-full" />}
                </Link>
              );
            })}
            {/* More button */}
            <button onClick={() => setShowMore(true)}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                showMore ? "text-primary" : "text-muted-foreground"
              }`}>
              <Menu className="size-5" />
              More
            </button>
          </div>
        </nav>

        {/* More drawer (mobile) */}
        {showMore && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowMore(false)} />
            <div className="relative bg-background rounded-t-2xl border-t border-border pb-8">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              {/* User info */}
              <div className="px-5 py-3 border-b border-border flex items-center gap-3">
                <div className="size-10 rounded-full gradient-primary text-primary-foreground grid place-items-center text-sm font-semibold">
                  {user.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.role}</div>
                </div>
              </div>
              {/* All nav items */}
              <div className="px-4 py-3 grid grid-cols-2 gap-2">
                {nav.map((n) => {
                  const active = path.startsWith(n.to);
                  return (
                    <Link key={n.to} to={n.to}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                        active ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                      }`}>
                      <n.icon className="size-4 shrink-0" />
                      <span className="text-sm font-medium">{n.label}</span>
                    </Link>
                  );
                })}
              </div>
              {/* Actions */}
              <div className="px-4 pt-2 flex items-center gap-2 border-t border-border mt-2">
                <Link to="/settings"
                  className="flex-1 h-11 rounded-xl border border-border inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-muted">
                  <Settings className="size-4" /> Settings
                </Link>
                <button onClick={toggleTheme}
                  className="h-11 px-4 rounded-xl border border-border inline-flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted">
                  {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </button>
                <button onClick={() => { clearSession(); navigate({ to: "/login" }); }}
                  className="h-11 px-4 rounded-xl border border-destructive/30 inline-flex items-center gap-2 text-sm text-destructive hover:bg-destructive/5">
                  <LogOut className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="border-b border-border px-4 md:px-6 py-4 md:py-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-lg md:text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
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
