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
import { TASKS_TABLE, rowToTask, supabase, taskToRow } from "./supabase";
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

// ---- Seed data so the first run feels alive (only once, when there's no data) ----
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
    t({ title: "Revisar feedback de Operations", date: today, status: "todo" }),
    t({ title: "Preparar roadmap Q4", date: today, status: "todo", priority: "medium" }),
    t({
      title: "Revisar métricas semanales",
      date: today,
      status: "todo",
      recurrence: { freq: "weekly", interval: 1 },
    }),
    t({ title: "Planning de producto", date: addDays(today, 2), time: "10:30", status: "todo" }),
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

// Read the local cache without seeding. Used in cloud mode.
function readCache(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Task[]) : [];
  } catch {
    return [];
  }
}

function writeCache(tasks: Task[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    /* ignore quota / private mode */
  }
}

// Local-only initial load, seeding on first ever run.
function loadLocal(): Task[] {
  if (typeof window === "undefined") return [];
  const cached = readCache();
  if (cached.length) return cached;
  if (!window.localStorage.getItem(SEED_KEY)) {
    const seeded = seedTasks();
    writeCache(seeded);
    window.localStorage.setItem(SEED_KEY, "1");
    return seeded;
  }
  return [];
}

interface StoreValue {
  tasks: Task[];
  ready: boolean;
  /** true when configured to sync with Supabase, false when using local storage only. */
  cloud: boolean;
  /** true when a Supabase read/write has failed (data still kept locally). */
  syncError: boolean;
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
  const [syncError, setSyncError] = useState(false);
  const tasksRef = useRef<Task[]>([]);
  const firstPersist = useRef(true);
  const cloud = supabase !== null;

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const reportErr = useCallback(
    (context: string) =>
      ({ error }: { error: unknown }) => {
        if (error) {
          console.error(`[supabase:${context}]`, error);
          setSyncError(true);
        }
      },
    [],
  );

  // ---- Initial load ----
  useEffect(() => {
    let active = true;

    if (supabase) {
      const client = supabase;
      // 1) Show the local cache instantly so a refresh never looks empty.
      const cached = readCache();
      if (cached.length) setTasks(cached);

      // 2) Reconcile with the server.
      client
        .from(TASKS_TABLE)
        .select("*")
        .then(({ data, error }) => {
          if (!active) return;
          if (error) {
            console.error("[supabase:load]", error);
            setSyncError(true);
            setReady(true);
            return; // keep the cached data
          }
          const server = (data ?? []).map(rowToTask);
          const serverIds = new Set(server.map((t) => t.id));
          // Rows that only exist locally → push them up (self-heal after downtime).
          const localOnly = cached.filter((t) => !serverIds.has(t.id));
          const merged = [...server, ...localOnly];
          setTasks(merged);
          writeCache(merged);
          for (const t of localOnly) {
            client.from(TASKS_TABLE).upsert(taskToRow(t)).then(reportErr("heal"));
          }
          setReady(true);
        });

      // 3) Realtime: keep devices in sync.
      const channel = client
        .channel("tasks-sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: TASKS_TABLE },
          (payload) => {
            setTasks((prev) => {
              let next: Task[];
              if (payload.eventType === "DELETE") {
                const id = (payload.old as { id?: string }).id;
                next = prev.filter((t) => t.id !== id);
              } else {
                const row = rowToTask(payload.new);
                next = prev.some((t) => t.id === row.id)
                  ? prev.map((t) => (t.id === row.id ? row : t))
                  : [...prev, row];
              }
              writeCache(next);
              return next;
            });
          },
        )
        .subscribe();

      return () => {
        active = false;
        client.removeChannel(channel);
      };
    }

    // Local-only mode.
    setTasks(loadLocal());
    setReady(true);
    return () => {
      active = false;
    };
  }, [reportErr]);

  // ---- Persist to localStorage on every change (both modes: acts as cache) ----
  useEffect(() => {
    if (!ready) return;
    if (firstPersist.current) {
      firstPersist.current = false;
      return;
    }
    writeCache(tasks);
  }, [tasks, ready]);

  // ---- Cross-tab sync (local mode only; cloud uses realtime) ----
  useEffect(() => {
    if (cloud) return;
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
  }, [cloud]);

  // ---- Cloud write helpers ----
  const pushUpsert = useCallback(
    (task: Task) => {
      if (supabase) supabase.from(TASKS_TABLE).upsert(taskToRow(task)).then(reportErr("upsert"));
    },
    [reportErr],
  );
  const pushDelete = useCallback(
    (id: string) => {
      if (supabase) supabase.from(TASKS_TABLE).delete().eq("id", id).then(reportErr("delete"));
    },
    [reportErr],
  );

  // ---- Mutations (optimistic local + cloud write) ----
  const add = useCallback(
    (partial: Partial<Task>) => {
      const task = newTask(partial);
      setTasks((prev) => [...prev, task]);
      pushUpsert(task);
      return task;
    },
    [pushUpsert],
  );

  const update = useCallback(
    (id: string, patch: Partial<Task>) => {
      const cur = tasksRef.current.find((t) => t.id === id);
      if (!cur) return;
      const updated = { ...cur, ...patch };
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      pushUpsert(updated);
    },
    [pushUpsert],
  );

  const remove = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      pushDelete(id);
    },
    [pushDelete],
  );

  const reorder = useCallback(
    (id: string, order: number) => {
      const cur = tasksRef.current.find((t) => t.id === id);
      if (!cur) return;
      const updated = { ...cur, order };
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      pushUpsert(updated);
    },
    [pushUpsert],
  );

  const toggleDone = useCallback(
    (id: string) => {
      const target = tasksRef.current.find((t) => t.id === id);
      if (!target) return;
      const completing = target.status !== "done";
      const updated: Task = {
        ...target,
        status: (completing ? "done" : target.date ? "todo" : "inbox") as Status,
        completedAt: completing ? new Date().toISOString() : null,
      };

      let spawned: Task | null = null;
      if (completing && target.recurrence && target.date) {
        spawned = newTask({
          title: target.title,
          date: nextOccurrence(target.date, target.recurrence),
          time: target.time,
          notes: target.notes,
          status: "todo",
          priority: target.priority,
          tags: [...target.tags],
          checklist: target.checklist.map((c) => ({ ...c, done: false })),
          recurrence: target.recurrence,
          order: target.order,
        });
      }

      setTasks((prev) => {
        const next = prev.map((t) => (t.id === id ? updated : t));
        return spawned ? [...next, spawned] : next;
      });
      pushUpsert(updated);
      if (spawned) pushUpsert(spawned);
    },
    [pushUpsert],
  );

  const clearCompleted = useCallback(() => {
    const doneIds = tasksRef.current.filter((t) => t.status === "done").map((t) => t.id);
    setTasks((prev) => prev.filter((t) => t.status !== "done"));
    if (supabase && doneIds.length) {
      supabase.from(TASKS_TABLE).delete().in("id", doneIds).then(reportErr("clearCompleted"));
    }
  }, [reportErr]);

  const value = useMemo<StoreValue>(
    () => ({
      tasks,
      ready,
      cloud,
      syncError,
      add,
      update,
      remove,
      toggleDone,
      reorder,
      clearCompleted,
    }),
    [tasks, ready, cloud, syncError, add, update, remove, toggleDone, reorder, clearCompleted],
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
