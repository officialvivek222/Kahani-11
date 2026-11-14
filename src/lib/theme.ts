import { useState, useEffect } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "kahani-theme";

export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const isDark = theme === "dark" || (theme === "system" && getSystemTheme() === "dark");
  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    try {
      return (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
    } catch {
      return "system";
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (saved === "dark") return "dark";
      if (saved === "light") return "light";
    } catch (e) {
      void e;
    }
    return getSystemTheme();
  });

  useEffect(() => {
    applyTheme(theme);
    setResolvedTheme(theme === "system" ? getSystemTheme() : theme);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
        if (!saved || saved === "system") {
          applyTheme("system");
          setResolvedTheme(getSystemTheme());
        }
      } catch (e) {
        void e;
      }
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const setTheme = (next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      void e;
    }
    setThemeState(next);
  };

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return {
    theme,
    resolvedTheme,
    isDark: resolvedTheme === "dark",
    setTheme,
    toggleTheme,
  };
}

export const themeScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');var d=document.documentElement;if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){d.classList.add('dark');}else{d.classList.remove('dark');}}catch(e){}})();`;
