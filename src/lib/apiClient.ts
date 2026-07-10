import { getSession } from "./auth";

export async function apiFetch(url: string, options: RequestInit = {}) {
  const session = getSession();
  const headers = new Headers(options.headers || {});
  if (session?.student_id) headers.set("x-student-id", session.student_id);
  return fetch(url, { ...options, headers });
}
