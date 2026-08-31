"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Task } from "@/lib/types";

interface ComposeState {
  open: boolean;
  /** Prefill for a new task (e.g. a date when adding from the calendar). */
  prefill: Partial<Task>;
}

interface UIValue {
  compose: ComposeState;
  openCompose: (prefill?: Partial<Task>) => void;
  closeCompose: () => void;
  openTaskId: string | null;
  openTask: (id: string) => void;
  closeTask: () => void;
}

const UICtx = createContext<UIValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [compose, setCompose] = useState<ComposeState>({ open: false, prefill: {} });
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const openCompose = useCallback((prefill: Partial<Task> = {}) => {
    setCompose({ open: true, prefill });
  }, []);
  const closeCompose = useCallback(() => setCompose({ open: false, prefill: {} }), []);
  const openTask = useCallback((id: string) => setOpenTaskId(id), []);
  const closeTask = useCallback(() => setOpenTaskId(null), []);

  const value = useMemo<UIValue>(
    () => ({ compose, openCompose, closeCompose, openTaskId, openTask, closeTask }),
    [compose, openCompose, closeCompose, openTaskId, openTask, closeTask],
  );

  return <UICtx.Provider value={value}>{children}</UICtx.Provider>;
}

export function useUI(): UIValue {
  const ctx = useContext(UICtx);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}
