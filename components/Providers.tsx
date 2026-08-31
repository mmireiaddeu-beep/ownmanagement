"use client";

import { StoreProvider } from "@/lib/store";
import { UIProvider } from "./ui-context";
import { AppShell } from "./AppShell";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <UIProvider>
        <AppShell>{children}</AppShell>
      </UIProvider>
    </StoreProvider>
  );
}
