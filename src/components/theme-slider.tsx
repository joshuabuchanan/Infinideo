"use client";

import { Moon, Star, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

const themes = ["dark", "light", "bright"] as const;
const themeLabels = {
  dark: "Dark",
  light: "Light",
  bright: "Bright",
} as const;

export function ThemeSlider() {
  const { theme, setTheme } = useTheme();
  const value = themes.indexOf(theme);

  return (
    <div className="theme-slider-control" data-theme={theme} title={`Appearance: ${themeLabels[theme]}`}>
      <input
        aria-label="Appearance"
        aria-valuetext={themeLabels[theme]}
        max={2}
        min={0}
        onChange={(event) => setTheme(themes[Number(event.currentTarget.value)])}
        step={1}
        type="range"
        value={value}
      />
      <div className="theme-slider-modes" aria-hidden="true">
        <Moon />
        <Star />
        <Sun />
      </div>
    </div>
  );
}
