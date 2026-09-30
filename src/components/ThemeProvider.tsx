"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "bright";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const STORAGE_KEY = "infinideo-theme-v2";

export function getThemeClasses(theme: Theme) {
  return {
    dark: theme === "dark",
    light: theme === "light",
    bright: theme === "bright",
  };
}

function readTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "dark" || saved === "light" || saved === "bright" ? saved : "dark";
  } catch {
    return "dark";
  }
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const classes = getThemeClasses(theme);

  root.classList.toggle("dark", classes.dark);
  root.classList.toggle("light", classes.light);
  root.classList.toggle("bright", classes.bright);
  root.dataset.theme = theme;
  root.style.colorScheme = theme === "bright" ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setTheme(readTheme());
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!mounted) return;

    applyTheme(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Continue even when storage is unavailable.
    }
  }, [theme, mounted]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      if (event.newValue === "dark" || event.newValue === "light" || event.newValue === "bright") {
        setTheme(event.newValue);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleTheme = () => {
    setTheme((current) => current === "dark" ? "light" : current === "light" ? "bright" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
