import type { Pathogen, Biomarker } from "@/data/pathogens";

export interface ClinicalCase {
  id: string;
  createdAt: string;
  doctor: string;
  mode: "symptom" | "biomarker";
  input: string;
  pathogenId: string;
  pathogenName: string;
  riskLevel: string;
  biomarkerName: string;
  sensorId: string;
  notes?: string;
}

const KEY = "chemosense.cases";

export function loadCases(): ClinicalCase[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCase(c: ClinicalCase) {
  const list = loadCases();
  list.unshift(c);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)));
}

export function updateCase(id: string, patch: Partial<ClinicalCase>) {
  const list = loadCases().map((c) => (c.id === id ? { ...c, ...patch } : c));
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function findCase(id: string): ClinicalCase | undefined {
  return loadCases().find((c) => c.id === id);
}

export function newCaseId() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `CS-${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function buildCase(opts: {
  doctor: string;
  mode: "symptom" | "biomarker";
  input: string;
  pathogen: Pathogen;
  biomarker: Biomarker;
}): ClinicalCase {
  return {
    id: newCaseId(),
    createdAt: new Date().toISOString(),
    doctor: opts.doctor,
    mode: opts.mode,
    input: opts.input,
    pathogenId: opts.pathogen.id,
    pathogenName: opts.pathogen.name,
    riskLevel: opts.pathogen.riskLevel,
    biomarkerName: opts.biomarker.name,
    sensorId: opts.biomarker.recommendedSensor,
  };
}