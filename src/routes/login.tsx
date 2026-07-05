import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { setSession, type SessionUser } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (s: Record<string, unknown>) => ({ demo: s.demo === "1" || s.demo === 1 || s.demo === true || s.demo === "true" }),
  head: () => ({ meta: [{ title: "Sign in — ChemoSense" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const { demo } = useSearch({ from: "/login" });
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<SessionUser["role"]>("Doctor");
  const [isRegister, setIsRegister] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (demo) {
      setStudentId("demo");
      setPassword("demo123");
      // Auto-submit after short delay
      setTimeout(async () => {
        try {
          const res = await fetch("https://chemosense-backend.onrender.com/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ student_id: "demo", password: "demo123" }),
          });
          const data = await res.json();
          if (data.id) {
            setSession(data);
            navigate({ to: "/dashboard" });
          }
        } catch {}
      }, 500);
    }
  }, [demo]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId || password.length < 4) {
      setErr("Enter your Student ID and password (min 4 chars).");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      if (isRegister) {
        // Register new user
        const res = await fetch("https://chemosense-backend.onrender.com/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id: studentId,
            email: studentId + "@chemosense.app",
            password,
            name: name || studentId,
            role,
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Registration failed");
        }
        const data = await res.json();
        setSession({ email: data.email, name: data.name || studentId, role });
        navigate({ to: "/dashboard" });
      } else {
        // Login
        const res = await fetch("https://chemosense-backend.onrender.com/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_id: studentId, password }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Invalid credentials");
        }
        const data = await res.json();
        setSession({ email: data.email, name: data.name || studentId, role: data.role || role });
        navigate({ to: "/dashboard" });
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between p-10 gradient-primary text-primary-foreground relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,.15), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,.1), transparent 50%)" }} />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-md bg-primary-foreground/15 grid place-items-center font-mono font-bold">CS</div>
            <span className="font-semibold">ChemoSense</span>
          </div>
        </div>
        <div className="relative">
          <h2 className="text-3xl font-semibold leading-tight max-w-sm">
            Selective chemosensors for rapid pathogen detection.
          </h2>
          <p className="mt-3 text-sm opacity-75 max-w-sm">
            Identify bacterial metabolites, toxins, and quorum-sensing molecules in minutes — not days.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-xs">
            <Stat n="8" l="Pathogens" />
            <Stat n="5" l="Sensor platforms" />
            <Stat n="<15m" l="Detection" />
          </div>
        </div>
        <div className="text-[11px] opacity-70 relative">For clinical decision support. Not a replacement for culture.</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h1 className="text-xl font-semibold">{isRegister ? "Create Account" : "Sign in"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRegister ? "Register with your Student ID" : "Login with your unique Student ID"}
          </p>

          {isRegister && (
            <>
              <label className="block mt-6 text-xs font-medium">Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Dr. A. Rao"
                className="mt-1 w-full border border-input rounded-md px-3 h-10 text-sm" />
            </>
          )}

          <label className="block mt-6 text-xs font-medium">Student ID</label>
          <input
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="e.g. 192311034"
            className="mt-1 w-full border border-input rounded-md px-3 h-10 text-sm font-mono"
          />

          <label className="block mt-4 text-xs font-medium">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-input rounded-md px-3 h-10 text-sm" />

          {isRegister && (
            <>
              <label className="block mt-4 text-xs font-medium">Role</label>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {(["Doctor", "Lab Technician", "Student"] as const).map((r) => (
                  <button type="button" key={r} onClick={() => setRole(r)}
                    className={`h-9 rounded-md border text-xs font-medium ${role === r ? "border-primary bg-primary-muted text-primary" : "border-input text-muted-foreground"}`}>
                    {r}
                  </button>
                ))}
              </div>
            </>
          )}

          {err && <div className="mt-3 text-xs text-destructive">{err}</div>}

          <button disabled={loading} className="mt-6 w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-95 disabled:opacity-60">
            {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign in"}
          </button>

          {!isRegister && (
            <div className="mt-3 text-center">
              <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary underline">
                Forgot password?
              </Link>
            </div>
          )}
          <button type="button" onClick={() => { setIsRegister(!isRegister); setErr(""); }}
            className="mt-3 w-full text-xs text-muted-foreground underline">
            {isRegister ? "Already have an account? Sign in" : "New user? Create account"}
          </button>
          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-[11px] text-muted-foreground mb-2">Quick access</p>
            <button type="button" onClick={async () => {
              setStudentId("demo");
              setPassword("demo123");
              try {
                const res = await fetch("https://chemosense-backend.onrender.com/api/login", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ student_id: "demo", password: "demo123" }),
                });
                const data = await res.json();
                if (data.id) { (await import("@/lib/auth")).setSession(data); navigate({ to: "/dashboard" }); }
              } catch {}
            }} className="w-full h-9 rounded-md border border-primary/30 bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors">
              Try Demo Account
            </button>
          </div>
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
