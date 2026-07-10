import { supabase } from "@/integrations/supabase/client";

export type SessionRole = "admin" | "student";
export type Session = { role: SessionRole; email: string; userId: string };

// Legacy localStorage keys we sweep on every read to eliminate stale plaintext data.
const LEGACY_KEYS = ["session", "user_account"];

function purgeLegacy() {
  if (typeof window === "undefined") return;
  for (const k of LEGACY_KEYS) {
    try { window.localStorage.removeItem(k); } catch { /* ignore */ }
  }
}

let cachedSession: Session | null = null;
let subscribed = false;

function subscribeOnce() {
  if (subscribed || typeof window === "undefined") return;
  subscribed = true;
  supabase.auth.onAuthStateChange(() => { void loadSession(); });
}

/**
 * Synchronous, best-effort session getter for rendering UI shells.
 * Reflects the last value resolved by loadSession(). Never trust this for
 * privileged decisions — always verify server-side.
 */
export function readSession(): Session | null {
  purgeLegacy();
  subscribeOnce();
  return cachedSession;
}

/**
 * Reads the current Supabase-authenticated session and resolves the role
 * from the server-side `user_roles` table. Returns null if not signed in.
 * Role is never trusted from client storage.
 */
export async function loadSession(): Promise<Session | null> {
  if (typeof window === "undefined") return null;
  purgeLegacy();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { cachedSession = null; return null; }
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  cachedSession = {
    role: roleRow ? "admin" : "student",
    email: user.email ?? "",
    userId: user.id,
  };
  return cachedSession;
}

export async function clearSession() {
  purgeLegacy();
  cachedSession = null;
  try { await supabase.auth.signOut(); } catch { /* ignore */ }
}

export function redirectToAuth() {
  if (typeof window !== "undefined") window.location.replace("/auth");
}