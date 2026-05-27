import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getSession } from "@/lib/auth";
import { ScanLine, FlaskConical, Bell, TrendingUp, Shield, Cpu, ArrowRight, Activity } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({ meta: [{ title: "ChemoSense — Selective Chemosensors for Pathogen Detection" }] }),
});

function Index() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getSession()) {
      navigate({ to: "/dashboard" });
    } else {
      setReady(true);
    }
  }, [navigate]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-primary grid place-items-center text-primary-foreground font-mono text-xs font-bold">CS</div>
          <span className="font-semibold text-sm">ChemoSense</span>
        </div>
        <Link to="/login" className="h-9 px-4 text-xs rounded-md bg-primary text-primary-foreground inline-flex items-center gap-1.5 font-medium">
          Sign in <ArrowRight className="size-3.5" />
        </Link>
      </header>

      {/* Hero */}
      <section className="px-6 py-20 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium mb-6">
          <Activity className="size-3.5" /> Selective Chemosensors · Rapid Pathogen Detection
        </div>
        <h1 className="text-4xl font-bold tracking-tight leading-tight mb-4">
          Detect Pathogenic Bacteria<br />
          <span className="text-primary">Before It Becomes Critical</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
          ChemoSense uses selective chemosensors to detect bacterial metabolites, toxins, and quorum-sensing molecules — enabling rapid infection diagnosis at the point of care.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link to="/login" className="h-11 px-6 rounded-md bg-primary text-primary-foreground inline-flex items-center gap-2 font-medium shadow-elegant">
            <ScanLine className="size-4" /> Start Scanning
          </Link>
          <Link to="/login?demo=1" className="h-11 px-6 rounded-md border border-border inline-flex items-center gap-2 text-sm hover:bg-muted">
            Try Demo →
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/30 py-10">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "9+", label: "Pathogens Covered" },
            { value: "40+", label: "Biomarkers Mapped" },
            { value: "<2h", label: "Detection Time" },
            { value: "99%", label: "Specificity Target" },
          ].map(s => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2">How ChemoSense Works</h2>
        <p className="text-muted-foreground text-center text-sm mb-10">From sensor signal to clinical decision in minutes</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Cpu,
              title: "Chemosensor Detection",
              desc: "Electrochemical and optical sensors detect bacterial metabolites, quorum-sensing molecules, and virulence biomarkers at nanomolar concentrations.",
              color: "bg-teal-500",
            },
            {
              icon: FlaskConical,
              title: "Biomarker Analysis",
              desc: "AI-powered scan engine matches detected biomarkers to pathogen profiles — covering Pseudomonas, MRSA, Klebsiella, E. coli, and more.",
              color: "bg-blue-500",
            },
            {
              icon: Shield,
              title: "Clinical Decision Support",
              desc: "Generates actionable reports with empirical treatment recommendations, AMR status, and quorum sensing stage — in real time.",
              color: "bg-violet-500",
            },
          ].map(f => (
            <div key={f.title} className="clinical-card p-6">
              <div className={`size-10 rounded-xl ${f.color} grid place-items-center mb-4`}>
                <f.icon className="size-5 text-white" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pathogens */}
      <section className="py-12 px-6 bg-muted/20 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-8">Pathogens Covered</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "Pseudomonas aeruginosa", "MRSA", "Klebsiella pneumoniae",
              "E. coli (UPEC)", "Acinetobacter baumannii", "Staphylococcus aureus",
              "Streptococcus pneumoniae", "Enterococcus faecalis", "Candida albicans"
            ].map(p => (
              <span key={p} className="px-3 py-1.5 rounded-full border border-border bg-background text-xs font-medium">
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to detect faster?</h2>
        <p className="text-muted-foreground mb-6 text-sm">Sign in to access the full ChemoSense clinical platform.</p>
        <Link to="/login" className="h-11 px-8 rounded-md bg-primary text-primary-foreground inline-flex items-center gap-2 font-medium shadow-elegant">
          Get Started <ArrowRight className="size-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        ChemoSense — Selective Chemosensors for Rapid Detection of Pathogenic Bacteria and Infection Biomarkers
      </footer>
    </div>
  );
}
