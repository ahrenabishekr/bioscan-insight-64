import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useState, useEffect } from "react";
import { Bell, CheckCheck, AlertTriangle, Info } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";

const API_URL = "https://chemosense-backend.onrender.com/api";

export const Route = createFileRoute("/alerts")({
  component: () => <AppShell><Page /></AppShell>,
  head: () => ({ meta: [{ title: "Alerts — ChemoSense" }] }),
});

function Page() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAlerts(); }, []);

  async function loadAlerts() {
    setLoading(true);
    try {
      const r = await apiFetch(`${API_URL}/alerts`);
      if (r.status === 401) { navigate({ to: "/login" }); return; }
      const data = await r.json();
      setAlerts(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  }

  async function markRead(id: number) {
    await apiFetch(`${API_URL}/alerts/${id}/read`, { method: "PATCH" });
    setAlerts(a => a.map(x => x.id === id ? { ...x, is_read: 1 } : x));
  }

  async function markAllRead() {
    await apiFetch(`${API_URL}/alerts/read-all`, { method: "PATCH" });
    setAlerts(a => a.map(x => ({ ...x, is_read: 1 })));
  }

  const unread = alerts.filter(a => !a.is_read).length;

  return (
    <>
      <PageHeader
        title="Alerts"
        subtitle={`${unread} unread alert${unread !== 1 ? "s" : ""}`}
        actions={
          unread > 0 ? (
            <button onClick={markAllRead}
              className="h-8 px-3 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          ) : undefined
        }
      />
      <div className="px-6 py-6 max-w-3xl space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && alerts.length === 0 && (
          <div className="clinical-card p-8 text-center">
            <Bell className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No alerts yet. Critical and high-risk scans will appear here.</p>
          </div>
        )}
        {alerts.map(a => (
          <div key={a.id} onClick={() => !a.is_read && markRead(a.id)}
            className={`clinical-card p-4 cursor-pointer transition-all ${!a.is_read ? "border-l-4 border-l-destructive" : "opacity-60"}`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 size-7 rounded-full grid place-items-center shrink-0 ${a.type === "critical_scan" ? "bg-destructive/10 text-destructive" : "bg-amber-100 text-amber-600"}`}>
                {a.type === "critical_scan" ? <AlertTriangle className="size-3.5" /> : <Info className="size-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{a.title}</p>
                  {!a.is_read && <span className="size-2 rounded-full bg-destructive shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Patient: <span className="font-mono">{a.patient_id}</span> · {new Date(a.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
