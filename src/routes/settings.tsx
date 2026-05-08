import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { getSession, setSession, type SessionUser } from "@/lib/auth";
import { applyTheme, getTheme, type Theme } from "@/lib/theme";
import { Sun, Moon, User } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: () => <AppShell><Page /></AppShell>,
  head: () => ({ meta: [{ title: "Settings — ChemoSense" }] }),
});

function Page() {
  const [u, setU] = useState<SessionUser | null>(null);
  const [theme, setTheme] = useState<Theme>("light");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setU(getSession());
    setTheme(getTheme());
  }, []);

  if (!u) return null;

  function update<K extends keyof SessionUser>(k: K, v: SessionUser[K]) {
    setU({ ...u!, [k]: v });
  }

  function save() {
    setSession(u!);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function changeTheme(t: Theme) {
    setTheme(t);
    applyTheme(t);
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Profile, appearance, and preferences." />
      <div className="px-6 py-6 max-w-3xl space-y-5">
        <section className="clinical-card p-5">
          <h2 className="text-sm font-semibold flex items-center gap-2"><User className="size-4 text-primary" /> Profile</h2>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <Field label="Full name" value={u.name} onChange={(v) => update("name", v)} />
            <Field label="Email" value={u.email} onChange={(v) => update("email", v)} type="email" />
            <Field label="Staff ID" value={u.staffId ?? ""} onChange={(v) => update("staffId", v)} placeholder="MD-00421" />
            <Field label="Department" value={u.department ?? ""} onChange={(v) => update("department", v)} placeholder="Infectious Diseases" />
            <Field label="Hospital" value={u.hospital ?? ""} onChange={(v) => update("hospital", v)} placeholder="St. Mary's Medical Centre" />
            <Field label="Phone" value={u.phone ?? ""} onChange={(v) => update("phone", v)} placeholder="+1 555 0142" />
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium">Role</span>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {(["Doctor", "Lab Technician", "Student"] as const).map((r) => (
                  <button key={r} type="button" onClick={() => update("role", r)}
                    className={`h-9 rounded-md border text-xs font-medium ${u.role === r ? "border-primary bg-primary-muted text-primary" : "border-input text-muted-foreground"}`}>
                    {r}
                  </button>
                ))}
              </div>
            </label>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={save} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Save profile</button>
            {saved && <span className="text-xs text-primary">Saved.</span>}
          </div>
        </section>

        <section className="clinical-card p-5">
          <h2 className="text-sm font-semibold">Appearance</h2>
          <p className="text-xs text-muted-foreground mt-1">Switch between light and dark mode.</p>
          <div className="mt-3 inline-flex border border-border rounded-md p-1">
            <button onClick={() => changeTheme("light")} className={`px-4 h-9 text-xs font-medium rounded inline-flex items-center gap-2 ${theme === "light" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><Sun className="size-3.5" /> Light</button>
            <button onClick={() => changeTheme("dark")} className={`px-4 h-9 text-xs font-medium rounded inline-flex items-center gap-2 ${theme === "dark" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><Moon className="size-3.5" /> Dark</button>
          </div>
        </section>
      </div>
    </>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium">{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-10 border border-input rounded-md px-3 text-sm bg-background" />
    </label>
  );
}
