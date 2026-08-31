"use client";

import { useEffect, useState } from "react";
import { addDays, relativeLabel, startOfWeek, todayYMD } from "@/lib/dates";
import { RECURRENCE_PRESETS, describeRecurrence } from "@/lib/recurrence";
import { useStore } from "@/lib/store";
import type { Priority, Recurrence, Status } from "@/lib/types";
import { Checkbox } from "./bits";
import {
  IconCalendar,
  IconClock,
  IconClose,
  IconPlus,
  IconRepeat,
  IconTag,
  IconTrash,
} from "./icons";
import { useUI } from "./ui-context";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const PRIORITIES: { key: Priority; label: string; dot: string }[] = [
  { key: "high", label: "Alta", dot: "bg-red-500" },
  { key: "medium", label: "Media", dot: "bg-amber-400" },
  { key: "low", label: "Baja", dot: "bg-zinc-300" },
];

const STATUSES: { key: Status; label: string }[] = [
  { key: "todo", label: "Pendiente" },
  { key: "doing", label: "En progreso" },
  { key: "done", label: "Hecho" },
];

export function TaskDrawer() {
  const { openTaskId, closeTask } = useUI();
  const { tasks, update, remove, toggleDone } = useStore();
  const task = tasks.find((t) => t.id === openTaskId) || null;
  const [tagInput, setTagInput] = useState("");
  const [checkInput, setCheckInput] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTask();
    };
    if (task) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [task, closeTask]);

  useEffect(() => {
    setTagInput("");
    setCheckInput("");
  }, [openTaskId]);

  if (!task) return null;

  const setDate = (date: string | null) =>
    update(task.id, {
      date,
      status: date ? (task.status === "inbox" ? "todo" : task.status) : "inbox",
    });

  const setRecurrence = (r: Recurrence | null) => update(task.id, { recurrence: r });

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !task.tags.includes(t)) update(task.id, { tags: [...task.tags, t] });
    setTagInput("");
  };
  const removeTag = (t: string) =>
    update(task.id, { tags: task.tags.filter((x) => x !== t) });

  const addCheck = () => {
    const t = checkInput.trim();
    if (!t) return;
    update(task.id, {
      checklist: [...task.checklist, { id: uid(), text: t, done: false }],
    });
    setCheckInput("");
  };
  const toggleCheck = (id: string) =>
    update(task.id, {
      checklist: task.checklist.map((c) =>
        c.id === id ? { ...c, done: !c.done } : c,
      ),
    });
  const removeCheck = (id: string) =>
    update(task.id, { checklist: task.checklist.filter((c) => c.id !== id) });

  const checkDone = task.checklist.filter((c) => c.done).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn" onClick={closeTask}>
      <div className="absolute inset-0 bg-ink/20" />
      <aside
        className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-paper shadow-drawer animate-slideIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-200/70 bg-paper/90 px-5 py-3 backdrop-blur">
          <Checkbox done={task.status === "done"} onToggle={() => toggleDone(task.id)} />
          <span className="text-[13px] font-medium text-zinc-400">
            {task.status === "done" ? "Completada" : "Editar tarea"}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => {
                remove(task.id);
                closeTask();
              }}
              className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500"
              aria-label="Eliminar"
            >
              <IconTrash width={18} height={18} />
            </button>
            <button
              onClick={closeTask}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Cerrar"
            >
              <IconClose width={18} height={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 px-5 py-5">
          {/* Title */}
          <textarea
            value={task.title}
            onChange={(e) => update(task.id, { title: e.target.value })}
            rows={1}
            className="w-full resize-none bg-transparent font-serif text-2xl leading-snug text-ink outline-none placeholder:text-zinc-300"
            placeholder="Título de la tarea"
          />

          {/* Date & time */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-ink">
                <IconCalendar width={16} height={16} className="text-zinc-400" />
                <input
                  type="date"
                  value={task.date ?? ""}
                  onChange={(e) => setDate(e.target.value || null)}
                  className="bg-transparent outline-none"
                />
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-ink">
                <IconClock width={16} height={16} className="text-zinc-400" />
                <input
                  type="time"
                  value={task.time ?? ""}
                  onChange={(e) => update(task.id, { time: e.target.value || null })}
                  className="bg-transparent outline-none"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <QuickChip label="Hoy" onClick={() => setDate(todayYMD())} />
              <QuickChip label="Mañana" onClick={() => setDate(addDays(todayYMD(), 1))} />
              <QuickChip
                label="Próx. semana"
                onClick={() => setDate(addDays(startOfWeek(todayYMD()), 7))}
              />
              <QuickChip label="Sin fecha · Inbox" onClick={() => setDate(null)} />
            </div>
          </div>

          {/* Status */}
          <Section label="Estado">
            <div className="flex gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  onClick={() =>
                    update(task.id, {
                      status: s.key,
                      completedAt: s.key === "done" ? new Date().toISOString() : null,
                    })
                  }
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    task.status === s.key
                      ? "bg-zinc-900 text-white"
                      : "bg-white text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Priority */}
          <Section label="Prioridad">
            <div className="flex gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p.label}
                  onClick={() =>
                    update(task.id, {
                      priority: task.priority === p.key ? null : p.key,
                    })
                  }
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    task.priority === p.key
                      ? "bg-zinc-900 text-white"
                      : "bg-white text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${p.dot}`} />
                  {p.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Notes */}
          <Section label="Notas">
            <textarea
              value={task.notes}
              onChange={(e) => update(task.id, { notes: e.target.value })}
              rows={3}
              placeholder="Añade notas…"
              className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-zinc-300 focus:border-accent"
            />
          </Section>

          {/* Checklist */}
          <Section
            label={
              task.checklist.length
                ? `Checklist · ${checkDone}/${task.checklist.length}`
                : "Checklist"
            }
          >
            <div className="flex flex-col gap-1">
              {task.checklist.map((c) => (
                <div
                  key={c.id}
                  className="group flex items-center gap-2.5 rounded-lg px-1 py-1"
                >
                  <Checkbox size="sm" done={c.done} onToggle={() => toggleCheck(c.id)} />
                  <span
                    className={`flex-1 text-sm ${
                      c.done ? "text-zinc-400 line-through" : "text-ink"
                    }`}
                  >
                    {c.text}
                  </span>
                  <button
                    onClick={() => removeCheck(c.id)}
                    className="text-zinc-300 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                    aria-label="Eliminar"
                  >
                    <IconClose width={14} height={14} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2.5 px-1 py-1">
                <IconPlus width={16} height={16} className="text-zinc-300" />
                <input
                  value={checkInput}
                  onChange={(e) => setCheckInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCheck()}
                  placeholder="Añadir subtarea…"
                  className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-zinc-300"
                />
              </div>
            </div>
          </Section>

          {/* Tags */}
          <Section label="Etiquetas">
            <div className="flex flex-wrap items-center gap-1.5">
              {task.tags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[12px] font-medium text-zinc-600"
                >
                  {t}
                  <button
                    onClick={() => removeTag(t)}
                    className="text-zinc-400 hover:text-red-500"
                  >
                    <IconClose width={12} height={12} />
                  </button>
                </span>
              ))}
              <span className="flex items-center gap-1 rounded-full border border-dashed border-zinc-300 px-2.5 py-1">
                <IconTag width={12} height={12} className="text-zinc-300" />
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTag()}
                  placeholder="etiqueta"
                  className="w-20 bg-transparent text-[12px] outline-none placeholder:text-zinc-300"
                />
              </span>
            </div>
          </Section>

          {/* Recurrence */}
          <Section label="Recurrencia">
            <div className="flex flex-wrap gap-1.5">
              {RECURRENCE_PRESETS.map((preset) => {
                const active =
                  task.recurrence &&
                  describeRecurrence(task.recurrence) === preset.label;
                return (
                  <button
                    key={preset.key}
                    onClick={() =>
                      setRecurrence(active ? null : preset.build(task.date ?? todayYMD()))
                    }
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      active
                        ? "bg-zinc-900 text-white"
                        : "bg-white text-zinc-500 hover:bg-zinc-100"
                    }`}
                  >
                    <IconRepeat width={13} height={13} />
                    {preset.label}
                  </button>
                );
              })}
            </div>
            {task.recurrence && !task.date && (
              <p className="mt-2 text-[12px] text-amber-600">
                Añade una fecha para que la recurrencia genere la próxima tarea al
                completarla.
              </p>
            )}
          </Section>
        </div>
      </aside>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </h3>
      {children}
    </div>
  );
}

function QuickChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full bg-white px-3 py-1 text-[12px] font-medium text-zinc-500 shadow-card transition-colors hover:bg-zinc-900 hover:text-white"
    >
      {label}
    </button>
  );
}
