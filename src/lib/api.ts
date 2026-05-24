export const API_URL = "https://chemosense-backend-production.up.railway.app/api";

export async function loadCasesFromAPI() {
  const res = await fetch(`${API_URL}/cases`);
  if (!res.ok) throw new Error("Failed to load cases");
  return res.json();
}

export async function saveCaseToAPI(c: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(c),
  });
  if (!res.ok) throw new Error("Failed to save case");
  return res.json();
}

export async function loadSensorsFromAPI() {
  const res = await fetch(`${API_URL}/sensors`);
  if (!res.ok) throw new Error("Failed to load sensors");
  return res.json();
}

export async function saveScanToAPI(scan: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/scans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scan),
  });
  if (!res.ok) throw new Error("Failed to save scan");
  return res.json();
}

export async function loadDashboardStats() {
  const res = await fetch(`${API_URL}/dashboard`);
  if (!res.ok) throw new Error("Failed to load dashboard");
  return res.json();
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  return res.json();
}

export async function scanSymptoms(text: string) {
  const res = await fetch(`${API_URL}/scan/symptoms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Scan failed");
  return res.json();
}

export async function scanByBiomarker(biomarker: string) {
  const res = await fetch(`${API_URL}/scan/biomarker`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ biomarker }),
  });
  if (!res.ok) throw new Error("Scan failed");
  return res.json();
}
