export type SessionRole = "admin" | "student";
export type Session = { role: SessionRole; email: string; at?: string };

const SESSION_KEY = "session";

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s || (s.role !== "admin" && s.role !== "student")) return null;
    return s;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function redirectToAuth() {
  if (typeof window !== "undefined") window.location.replace("/auth");
}