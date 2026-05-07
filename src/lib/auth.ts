export interface SessionUser {
  email: string;
  name: string;
  role: "Doctor" | "Lab Technician" | "Student";
}

const KEY = "chemosense.session";

export function getSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export function setSession(u: SessionUser) {
  localStorage.setItem(KEY, JSON.stringify(u));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}