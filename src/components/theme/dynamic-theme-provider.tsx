"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeTokens, PosLayoutBlueprint, PluginPackage } from "@/types/plugin-package";

export interface ActiveThemeState {
  currentPresetId: string;
  presetName: string;
  tokens: ThemeTokens;
  posLayout?: PosLayoutBlueprint;
}

const DEFAULT_THEME_TOKENS: ThemeTokens = {
  mode: "light",
  colors: {
    primary: "#4f46e5",
    primaryForeground: "#ffffff",
    background: "#F8FAFC",
    card: "#FFFFFF",
    border: "#E2E8F0",
    sidebar: "#0F172A",
    accent: "#06b6d4",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
  },
  typography: {
    fontFamily: "Plus Jakarta Sans, sans-serif",
    fontMono: "ui-monospace, monospace",
    baseFontSize: "14px",
    headingWeight: "bold",
  },
  effects: {
    borderRadius: "1rem",
    cardBorderRadius: "1.25rem",
    buttonBorderRadius: "0.75rem",
    glassmorphism: false,
    shadowScale: "md",
  },
};

const DEFAULT_PACKAGE: PluginPackage = {
  manifest: {
    id: "default",
    name: "Qassa Default Modern",
    type: "THEME",
    version: "1.0.0",
    author: "Qassa",
    compatibility: ">=1.0.0",
    priceMonthly: 0,
    priceAnnual: 0,
    tags: ["default", "clean", "light"],
    previewUrls: [],
    vertical: "GENERAL",
  },
  tokens: DEFAULT_THEME_TOKENS,
  layouts: {
    pos: {
      cartDock: "right",
      cartWidth: "380px",
      productGridColumns: 4,
      productCardStyle: "grid_card",
      showCategoriesAs: "horizontal_pills",
      slots: [
        { widget: "pos.search_bar", order: 1, colSpan: 12 },
        { widget: "pos.category_pills", order: 2, colSpan: 12 },
        { widget: "pos.quick_actions", order: 3, colSpan: 12 },
        { widget: "pos.product_grid", order: 4, colSpan: 12 },
        { widget: "pos.cart_sidebar", order: 5, colSpan: 12 },
      ],
    },
  },
};

export const BUILTIN_THEME_PRESETS: Record<string, { name: string; pkg: PluginPackage }> = {
  default: {
    name: "🌟 Qassa Default",
    pkg: DEFAULT_PACKAGE,
  },
};

interface DynamicThemeContextType {
  activePresetId: string;
  themeTokens: ThemeTokens;
  posLayout: PosLayoutBlueprint;
  setActivePresetId: (presetId: string) => void;
  applyCustomPackage: (pkg: PluginPackage) => void;
}

const DynamicThemeContext = createContext<DynamicThemeContextType | null>(null);

export function DynamicThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: any;
}) {
  const [activePresetId, setActivePresetId] = useState<string>("default");
  const [customPackage, setCustomPackage] = useState<PluginPackage | null>(null);

  const activePackage = useMemo(() => {
    if (customPackage) return customPackage;
    if (initialTheme) {
      return {
        manifest: {
          id: initialTheme.code || "active-theme",
          name: initialTheme.name || "Tema Aktif",
          type: "THEME" as const,
          version: "1.0.0",
          author: "Admin",
          compatibility: ">=1.0.0",
          priceMonthly: 0,
          priceAnnual: 0,
          tags: [],
          previewUrls: [],
          vertical: "GENERAL" as const,
        },
        tokens: initialTheme.tokens || DEFAULT_THEME_TOKENS,
        layouts: initialTheme.tokens?.layouts || DEFAULT_PACKAGE.layouts,
      };
    }
    return DEFAULT_PACKAGE;
  }, [initialTheme, customPackage]);


  const themeTokens: ThemeTokens = activePackage.tokens || DEFAULT_THEME_TOKENS;
  const posLayout: PosLayoutBlueprint = activePackage.layouts?.pos || {
    cartDock: "right",
    cartWidth: "380px",
    productGridColumns: 4,
    productCardStyle: "grid_card",
    showCategoriesAs: "horizontal_pills",
    slots: [],
  };

  // Inject CSS Variables to document root dynamically
  useEffect(() => {
    const root = document.documentElement;
    const colors = themeTokens.colors;
    const effects = themeTokens.effects;
    const typography = themeTokens.typography;

    if (colors) {
      root.style.setProperty("--primary", colors.primary);
      root.style.setProperty("--primary-foreground", colors.primaryForeground || "#ffffff");
      root.style.setProperty("--background", colors.background);
      root.style.setProperty("--card", colors.card);
      root.style.setProperty("--border", colors.border);
      if (colors.sidebar) root.style.setProperty("--sidebar", colors.sidebar);
      if (colors.accent) root.style.setProperty("--accent", colors.accent);
    }

    if (effects?.borderRadius) {
      root.style.setProperty("--radius", effects.borderRadius);
    }

    if (themeTokens.mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [themeTokens]);

  const applyCustomPackage = (pkg: PluginPackage) => {
    setCustomPackage(pkg);
    setActivePresetId(pkg.manifest.id);
  };

  return (
    <DynamicThemeContext.Provider
      value={{
        activePresetId,
        themeTokens,
        posLayout,
        setActivePresetId: (id) => {
          setCustomPackage(null);
          setActivePresetId(id);
        },
        applyCustomPackage,
      }}
    >
      {children}
    </DynamicThemeContext.Provider>
  );
}

export function useDynamicTheme() {
  const context = useContext(DynamicThemeContext);
  if (!context) {
    throw new Error("useDynamicTheme must be used within a DynamicThemeProvider");
  }
  return context;
}
