"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation, Locale } from "./language-context";
import { Globe, Check, ChevronDown } from "lucide-react";

export function IndonesiaFlag({ className = "w-4 h-3" }: { className?: string }) {
  return (
    <svg
      className={`${className} rounded-[3px] overflow-hidden shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex-shrink-0`}
      viewBox="0 0 640 480"
    >
      <path fill="#e11d48" d="M0 0h640v240H0z" />
      <path fill="#ffffff" d="M0 240h640v240H0z" />
    </svg>
  );
}

export function EnglishFlag({ className = "w-4 h-3" }: { className?: string }) {
  return (
    <svg
      className={`${className} rounded-[3px] overflow-hidden shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex-shrink-0`}
      viewBox="0 0 640 480"
    >
      <path fill="#012169" d="M0 0h640v480H0z" />
      <path
        fill="#FFF"
        d="m75 0 245 180L565 0h75v60L435 240l205 180v60h-75L320 300 75 480H0v-60l205-180L0 60V0z"
      />
      <path
        fill="#C8102E"
        d="m424 288 216 158v34h-46L378 322zm-208 0L0 446v34h46l216-158zm0-96L0 34V0h46l216 158zm208 0L640 34V0h-46L378 158z"
      />
      <path fill="#FFF" d="M240 0h160v480H240zM0 160h640v160H0z" />
      <path fill="#C8102E" d="M266 0h108v480H266zM0 186h640v108H0z" />
    </svg>
  );
}

interface LanguageSwitcherProps {
  variant?: "pill" | "dropdown" | "compact";
  className?: string;
  isDark?: boolean;
}

export function LanguageSwitcher({
  variant = "pill",
  className = "",
  isDark,
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages: {
    code: Locale;
    label: string;
    flag: React.ReactNode;
    short: string;
  }[] = [
    {
      code: "id",
      label: "Bahasa Indonesia",
      flag: <IndonesiaFlag />,
      short: "ID",
    },
    {
      code: "en",
      label: "English",
      flag: <EnglishFlag />,
      short: "EN",
    },
  ];

  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  // ─── 1. PILL TOGGLE VARIANT ──────────────────────────────────────────────
  if (variant === "pill") {
    // Dynamic theme styling
    const containerClasses =
      isDark === true
        ? "bg-slate-900/90 border-slate-800 text-slate-400"
        : isDark === false
        ? "bg-slate-100/90 border-slate-200/90 text-slate-500"
        : "bg-slate-100 dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400";

    const activeClasses =
      isDark === true
        ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
        : isDark === false
        ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
        : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-700/60";

    const inactiveClasses =
      isDark === true
        ? "text-slate-400 hover:text-slate-200"
        : isDark === false
        ? "text-slate-500 hover:text-slate-700"
        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200";

    return (
      <div
        className={`inline-flex items-center p-1 rounded-2xl border shadow-sm transition-colors ${containerClasses} ${className}`}
      >
        {languages.map((lang) => {
          const isActive = locale === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLocale(lang.code)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive ? activeClasses : inactiveClasses
              }`}
            >
              {lang.flag}
              <span>{lang.short}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // ─── 2. COMPACT BUTTON VARIANT ───────────────────────────────────────────
  if (variant === "compact") {
    const nextLocale: Locale = locale === "id" ? "en" : "id";
    return (
      <button
        type="button"
        onClick={() => setLocale(nextLocale)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition shadow-sm cursor-pointer ${className}`}
        title={`Ganti ke ${nextLocale.toUpperCase()}`}
      >
        {currentLang.flag}
        <span>{currentLang.short}</span>
      </button>
    );
  }

  // ─── 3. DROPDOWN VARIANT ─────────────────────────────────────────────────
  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition cursor-pointer"
      >
        {currentLang.flag}
        <span>{currentLang.short}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-1.5 animate-fadeIn">
          {languages.map((lang) => {
            const isSelected = locale === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLocale(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {lang.flag}
                  <span>{lang.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
