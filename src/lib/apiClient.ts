import { getSession } from "./auth";

export async function apiFetch(url: string, options: RequestInit = {}) {
  const session = getSession();
  const headers = new Headers(options.headers || {});
  if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);
  return fetch(url, { ...options, headers });
}
