"use client";

import { SessionProvider } from "next-auth/react";
import { DynamicThemeProvider } from "@/components/theme/dynamic-theme-provider";
import { LanguageProvider } from "@/lib/i18n/language-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <DynamicThemeProvider>{children}</DynamicThemeProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}


