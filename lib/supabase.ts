import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Task } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Single shared Supabase client, or null when env vars aren't configured
 * (in that case the app falls back to localStorage automatically).
 */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: false },
        realtime: { params: { eventsPerSecond: 5 } },
      })
    : null;

export const hasSupabase = supabase !== null;

export const TASKS_TABLE = "tasks";

// ---- Mapping between the JS Task shape (camelCase) and DB rows (snake_case) ----

/* eslint-disable @typescript-eslint/no-explicit-any */
export function rowToTask(row: any): Task {
  return {
    id: row.id,
    title: row.title ?? "",
    date: row.date ?? null,
    time: row.time ?? null,
    notes: row.notes ?? "",
    status: row.status ?? "inbox",
    priority: row.priority ?? null,
    tags: row.tags ?? [],
    checklist: row.checklist ?? [],
    createdAt: row.created_at ?? new Date().toISOString(),
    dueDate: row.due_date ?? null,
    recurrence: row.recurrence ?? null,
    completedAt: row.completed_at ?? null,
    order: Number(row.sort_order ?? 0),
  };
}

export function taskToRow(t: Task): Record<string, unknown> {
  return {
    id: t.id,
    title: t.title,
    date: t.date,
    time: t.time,
    notes: t.notes,
    status: t.status,
    priority: t.priority,
    tags: t.tags,
    checklist: t.checklist,
    created_at: t.createdAt,
    due_date: t.dueDate,
    recurrence: t.recurrence,
    completed_at: t.completedAt,
    sort_order: t.order,
  };
}
