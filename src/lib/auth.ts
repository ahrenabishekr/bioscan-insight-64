const API_URL = "https://chemosense-backend.onrender.com/api";

export interface SessionUser {
  email: string;
  name: string;
  role: "admin" | "doctor" | "technician";
  student_id?: string;
  staffId?: string;
  department?: string;
  hospital?: string;
  phone?: string;
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

// ─── BACKEND AUTH ──────────────────────────────────────────

export async function loginWithBackend(
  email: string,
  password: string,
  name: string,
  role: SessionUser["role"]
): Promise<SessionUser> {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      // User exists in DB — trust backend's role and student_id, not the param
      const data = await res.json();
      const user: SessionUser = {
        email: data.email,
        name: data.name,
        role: data.role,
        student_id: data.student_id,
      };
      setSession(user);
      return user;
    } else {
      // Not in DB — register them automatically
      await registerUser(email, password, name, role);
      const user: SessionUser = { email, name, role };
      setSession(user);
      return user;
    }
  } catch {
    // Backend offline — fallback to local session
    const user: SessionUser = { email, name, role };
    setSession(user);
    return user;
  }
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: SessionUser["role"]
) {
  await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name, role }),
  });
}
