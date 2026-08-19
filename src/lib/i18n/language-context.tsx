"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { id } from "./dictionaries/id";
import { en } from "./dictionaries/en";
import { phraseMap } from "./phrase-map";

export type Locale = "id" | "en";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
  tr: (text: string, vars?: Record<string, string | number>) => string;
  dictionary: typeof id;
}

const dictionaries: Record<Locale, typeof id> = { id, en };

const LanguageContext = createContext<LanguageContextType>({
  locale: "id",
  setLocale: () => {},
  t: (path: string) => path,
  tr: (text: string) => text,
  dictionary: id,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("id");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Read from localStorage or cookie on mount (default: id)
    try {
      const savedLocale = localStorage.getItem("qassa_locale") as Locale;
      if (savedLocale === "id") {
        setLocaleState("id");
      } else {
        setLocaleState("id");
        localStorage.setItem("qassa_locale", "id");
      }
    } catch {
      // Ignore
    }
    setIsInitialized(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("qassa_locale", newLocale);
      document.cookie = `qassa_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignore
    }
  };

  /**
   * Domain key path lookup (e.g. t("nav.dashboard"))
   */
  const t = (path: string, vars?: Record<string, string | number>): string => {
    const dict = dictionaries[locale] || id;
    const fallbackDict = id;

    const keys = path.split(".");
    let current: any = dict;
    let fallbackCurrent: any = fallbackDict;

    for (const key of keys) {
      current = current?.[key];
      fallbackCurrent = fallbackCurrent?.[key];
    }

    let result =
      typeof current === "string"
        ? current
        : typeof fallbackCurrent === "string"
        ? fallbackCurrent
        : path;

    if (vars && typeof result === "string") {
      Object.entries(vars).forEach(([k, v]) => {
        result = result.replace(new RegExp(`{${k}}`, "g"), String(v));
      });
    }

    return result;
  };

  /**
   * Direct Indonesian phrase auto-translation (e.g. tr("Simpan Perubahan") -> "Save Changes")
   */
  const tr = (text: string, vars?: Record<string, string | number>): string => {
    if (!text) return "";
    if (locale === "id") return text;

    const cleanText = text.trim();
    let translated = phraseMap[cleanText] || phraseMap[text] || text;

    if (vars && typeof translated === "string") {
      Object.entries(vars).forEach(([k, v]) => {
        translated = translated.replace(new RegExp(`{${k}}`, "g"), String(v));
      });
    }

    return translated;
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t,
        tr,
        dictionary: dictionaries[locale] || id,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
