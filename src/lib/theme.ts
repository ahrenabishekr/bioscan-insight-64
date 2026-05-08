export type Theme = "light" | "dark";
const KEY = "chemosense.theme";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const v = localStorage.getItem(KEY);
  if (v === "dark" || v === "light") return v;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", t === "dark");
  localStorage.setItem(KEY, t);
}
