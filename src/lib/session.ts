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

/**
 * Reads the current Supabase-authenticated session and resolves the role
 * from the server-side `user_roles` table. Returns null if not signed in.
 * Role is never trusted from client storage.
 */
export async function loadSession(): Promise<Session | null> {
  if (typeof window === "undefined") return null;
  purgeLegacy();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  return {
    role: roleRow ? "admin" : "student",
    email: user.email ?? "",
    userId: user.id,
  };
}

export async function clearSession() {
  purgeLegacy();
  try { await supabase.auth.signOut(); } catch { /* ignore */ }
}

export function redirectToAuth() {
  if (typeof window !== "undefined") window.location.replace("/auth");
}