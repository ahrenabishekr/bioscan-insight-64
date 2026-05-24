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
const API_URL = "https://chemosense-backend-production.up.railway.app/api";

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
  saveCaseToBackend(c).catch(console.error);
  saveScanToBackend(c).catch(console.error);
}

export function updateCase(id: string, patch: Partial<ClinicalCase>) {
  const list = loadCases().map((c) => (c.id === id ? { ...c, ...patch } : c));
  localStorage.setItem(KEY, JSON.stringify(list));
  updateCaseInBackend(id, patch).catch(console.error);
}

export function findCase(id: string): ClinicalCase | undefined {
  return loadCases().find((c) => c.id === id);
}

async function saveCaseToBackend(c: ClinicalCase) {
  await fetch(`${API_URL}/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: c.id,
      patient_name: c.doctor,
      patient_id: c.id,
      status: "open",
      notes: JSON.stringify({
        mode: c.mode,
        input: c.input,
        pathogenId: c.pathogenId,
        pathogenName: c.pathogenName,
        riskLevel: c.riskLevel,
        biomarkerName: c.biomarkerName,
        sensorId: c.sensorId,
      }),
    }),
  });
}

async function saveScanToBackend(c: ClinicalCase) {
  await fetch(`${API_URL}/scans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scanned_by: c.doctor,
      patient_id: c.id,
      pathogen_name: c.pathogenName,
      biomarker_name: c.biomarkerName,
      risk_level: c.riskLevel,
      result: "positive",
      notes: c.input,
    }),
  });
}

async function updateCaseInBackend(id: string, patch: Partial<ClinicalCase>) {
  await fetch(`${API_URL}/cases/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
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
