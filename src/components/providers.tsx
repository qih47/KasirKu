"use client";

import { SessionProvider } from "next-auth/react";
import { DynamicThemeProvider } from "@/components/theme/dynamic-theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DynamicThemeProvider>{children}</DynamicThemeProvider>
    </SessionProvider>
  );
}

