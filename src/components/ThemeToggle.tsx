import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  try {
    localStorage.setItem("almeqyas-theme", theme);
  } catch {
    /* ignore */
  }
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { lang } = useI18n();
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored =
      (typeof localStorage !== "undefined"
        ? (localStorage.getItem("almeqyas-theme") as Theme | null)
        : null) ?? null;
    const initial: Theme =
      stored ??
      (typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  const label =
    theme === "dark"
      ? lang === "ar"
        ? "الوضع النهاري"
        : "Light mode"
      : lang === "ar"
        ? "الوضع الليلي"
        : "Dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={
        "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-teal hover:text-teal-deep " +
        className
      }
    >
      <span aria-hidden>{theme === "dark" ? "☀️" : "🌙"}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
