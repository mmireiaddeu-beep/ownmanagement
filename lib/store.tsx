"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { addDays, todayYMD } from "./dates";
import { nextOccurrence } from "./recurrence";
import type { Priority, Status, Task } from "./types";

const STORAGE_KEY = "agenda.tasks.v1";
const SEED_KEY = "agenda.seeded.v1";

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function newTask(partial: Partial<Task> = {}): Task {
  return {
    id: uid(),
    title: "",
    date: null,
    time: null,
    notes: "",
    status: partial.date ? "todo" : "inbox",
    priority: null,
    tags: [],
    checklist: [],
    createdAt: new Date().toISOString(),
    dueDate: null,
    recurrence: null,
    completedAt: null,
    order: Date.now(),
    ...partial,
  };
}

// ---- Seed data so the first run feels alive (only once) ----
function seedTasks(): Task[] {
  const today = todayYMD();
  const t = (p: Partial<Task>) => newTask(p);
  return [
    t({
      title: "Preparar reunión con Sales",
      date: today,
      time: "09:00",
      status: "todo",
      priority: "medium",
      tags: ["sales"],
    }),
    t({
      title: "Revisar propuesta de pricing",
      date: today,
      time: "12:00",
      status: "todo",
      priority: "high",
      notes: "Revisar propuesta enviada por Sales y validar impacto en margen.",
      checklist: [
        { id: uid(), text: "Revisar pricing actual", done: false },
        { id: uid(), text: "Comparar propuesta", done: false },
        { id: uid(), text: "Preparar feedback", done: false },
      ],
    }),
    t({
      title: "Revisar feedback de Operations",
      date: today,
      status: "todo",
    }),
    t({
      title: "Preparar roadmap Q4",
      date: today,
      status: "todo",
      priority: "medium",
    }),
    t({
      title: "Revisar métricas semanales",
      date: today,
      status: "todo",
      recurrence: { freq: "weekly", interval: 1 },
    }),
    t({
      title: "Planning de producto",
      date: addDays(today, 2),
      time: "10:30",
      status: "todo",
    }),
    t({
      title: "1:1 con Edu",
      date: addDays(today, 3),
      time: "16:00",
      status: "todo",
      priority: "medium",
    }),
    t({ title: "Revisar documento de Operations", status: "inbox" }),
    t({ title: "Mirar propuesta de la agencia", status: "inbox" }),
    t({
      title: "Presentar roadmap al comité",
      date: addDays(today, 6),
      time: "11:00",
      status: "todo",
      priority: "high",
    }),
  ];
}

function load(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Task[];
    // First ever run: seed.
    if (!window.localStorage.getItem(SEED_KEY)) {
      const seeded = seedTasks();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      window.localStorage.setItem(SEED_KEY, "1");
      return seeded;
    }
    return [];
  } catch {
    return [];
  }
}

interface StoreValue {
  tasks: Task[];
  ready: boolean;
  add: (partial: Partial<Task>) => Task;
  update: (id: string, patch: Partial<Task>) => void;
  remove: (id: string) => void;
  toggleDone: (id: string) => void;
  reorder: (id: string, order: number) => void;
  clearCompleted: () => void;
}

const StoreCtx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);
  const firstPersist = useRef(true);

  useEffect(() => {
    setTasks(load());
    setReady(true);
  }, []);

  // Persist on every change (after initial load).
  useEffect(() => {
    if (!ready) return;
    if (firstPersist.current) {
      firstPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      /* ignore quota / private mode */
    }
  }, [tasks, ready]);

  // Sync across tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setTasks(JSON.parse(e.newValue));
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((partial: Partial<Task>) => {
    const task = newTask(partial);
    setTasks((prev) => [...prev, task]);
    return task;
  }, []);

  const update = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const remove = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const reorder = useCallback((id: string, order: number) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, order } : t)));
  }, []);

  const toggleDone = useCallback((id: string) => {
    setTasks((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;
      const completing = target.status !== "done";
      const next = prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: (completing ? "done" : t.date ? "todo" : "inbox") as Status,
              completedAt: completing ? new Date().toISOString() : null,
            }
          : t,
      );
      // If completing a recurring task with a date, spawn the next occurrence.
      if (completing && target.recurrence && target.date) {
        const upcoming = newTask({
          title: target.title,
          date: nextOccurrence(target.date, target.recurrence),
          time: target.time,
          notes: target.notes,
          status: "todo",
          priority: target.priority,
          tags: [...target.tags],
          checklist: target.checklist.map((c) => ({ ...c, done: false })),
          dueDate: null,
          recurrence: target.recurrence,
          order: target.order,
        });
        return [...next, upcoming];
      }
      return next;
    });
  }, []);

  const clearCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((t) => t.status !== "done"));
  }, []);

  const value = useMemo<StoreValue>(
    () => ({ tasks, ready, add, update, remove, toggleDone, reorder, clearCompleted }),
    [tasks, ready, add, update, remove, toggleDone, reorder, clearCompleted],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

// ---- Selectors / helpers ----

export function sortByTime(a: Task, b: Task): number {
  if (a.time && b.time) return a.time.localeCompare(b.time);
  if (a.time && !b.time) return -1;
  if (!a.time && b.time) return 1;
  return a.order - b.order;
}

export const PRIORITY_ORDER: Record<Exclude<Priority, null>, number> = {
  high: 0,
  medium: 1,
  low: 2,
};
