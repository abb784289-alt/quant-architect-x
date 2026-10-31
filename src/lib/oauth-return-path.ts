export function oauthReturnPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) return "/";
  // A fixed parsing origin keeps route search validation safe during SSR.
  const origin = "https://app.invalid";
  try {
    const target = new URL(value, origin);
    if (target.origin !== origin || target.pathname.startsWith("//")) return "/";
    return target.pathname + target.search + target.hash;
  } catch {
    return "/";
  }
}

/** Post-auth destination: validated `next` from the current URL, else /tracks. */
export function postAuthPath(): string {
  if (typeof window === "undefined") return "/tracks";
  const p = oauthReturnPath(new URLSearchParams(window.location.search).get("next"));
  return p === "/" ? "/tracks" : p;
}
