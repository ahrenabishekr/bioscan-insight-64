import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { setSession, type SessionUser } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — ChemoSense" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("Dr. A. Rao");
  const [role, setRole] = useState<SessionUser["role"]>("Doctor");
  const [err, setErr] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || password.length < 4) {
      setErr("Enter a valid email and a password (min 4 chars).");
      return;
    }
    setSession({ email, name, role });
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between p-10 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-md bg-primary-foreground/15 grid place-items-center font-mono font-bold">CS</div>
          <span className="font-semibold">ChemoSense</span>
        </div>
        <div>
          <h2 className="text-3xl font-semibold leading-tight max-w-sm">
            Selective chemosensors for rapid pathogen detection.
          </h2>
          <p className="mt-3 text-sm opacity-75 max-w-sm">
            Identify bacterial metabolites, toxins, and quorum-sensing molecules in minutes — not days.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-xs">
            <Stat n="5" l="Pathogens" />
            <Stat n="5" l="Sensor platforms" />
            <Stat n="<15m" l="Detection" />
          </div>
        </div>
        <div className="text-[11px] opacity-60">For clinical decision support. Not a replacement for culture.</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground mt-1">Use any email and password — local session.</p>

          <label className="block mt-6 text-xs font-medium">Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border border-input rounded-md px-3 h-10 text-sm" />

          <label className="block mt-4 text-xs font-medium">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="doctor@hospital.org" className="mt-1 w-full border border-input rounded-md px-3 h-10 text-sm" />

          <label className="block mt-4 text-xs font-medium">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full border border-input rounded-md px-3 h-10 text-sm" />

          <label className="block mt-4 text-xs font-medium">Role</label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {(["Doctor", "Lab Technician", "Student"] as const).map((r) => (
              <button type="button" key={r} onClick={() => setRole(r)}
                className={`h-9 rounded-md border text-xs font-medium ${role === r ? "border-primary bg-primary-muted text-primary" : "border-input text-muted-foreground"}`}>
                {r}
              </button>
            ))}
          </div>

          {err && <div className="mt-3 text-xs text-destructive">{err}</div>}

          <button className="mt-6 w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-95">
            Continue
          </button>
          <p className="mt-3 text-[11px] text-muted-foreground text-center">
            Role determines default view — Doctors → Dashboard, Lab Techs → Sensors, Students → Library.
          </p>
        </form>
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold">{n}</div>
      <div className="opacity-70 mt-0.5">{l}</div>
    </div>
  );
}