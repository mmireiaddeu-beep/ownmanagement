"use client";

import { useEffect, useRef, useState } from "react";
import { relativeLabel } from "@/lib/dates";
import { parseQuickAdd } from "@/lib/nlp";
import { useStore } from "@/lib/store";
import type { Priority } from "@/lib/types";
import { IconCalendar, IconClock, IconClose } from "./icons";
import { useUI } from "./ui-context";

const PRIORITIES: { key: Priority; label: string; dot: string }[] = [
  { key: "high", label: "Alta", dot: "bg-red-500" },
  { key: "medium", label: "Media", dot: "bg-amber-400" },
  { key: "low", label: "Baja", dot: "bg-zinc-300" },
];

export function QuickAdd() {
  const { compose, closeCompose } = useUI();
  const { add } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Priority>(null);
  const [flash, setFlash] = useState(false);

  // Prefill (e.g. date coming from a calendar slot) shows as a fixed chip.
  const prefill = compose.prefill;

  useEffect(() => {
    if (compose.open) {
      setText("");
      setPriority((prefill.priority as Priority) ?? null);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [compose.open, prefill.priority]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCompose();
    };
    if (compose.open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [compose.open, closeCompose]);

  if (!compose.open) return null;

  const parsed = parseQuickAdd(text);
  const effectiveDate = prefill.date ?? parsed.date;
  const effectiveTime = prefill.time ?? parsed.time;

  const submit = (keepOpen: boolean) => {
    const title = parsed.title.trim();
    if (!title) return;
    add({
      title,
      date: effectiveDate ?? null,
      time: effectiveTime ?? null,
      priority,
      status: effectiveDate ? "todo" : "inbox",
      ...(prefill.tags ? { tags: prefill.tags } : {}),
    });
    setText("");
    setFlash(true);
    setTimeout(() => setFlash(false), 700);
    if (keepOpen) {
      inputRef.current?.focus();
    } else {
      closeCompose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/20 px-4 pt-[12vh] animate-fadeIn"
      onClick={closeCompose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 pt-5">
          <span className="text-sm font-medium text-zinc-400">Nueva tarea</span>
          {prefill.date && (
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-medium text-accent">
              {relativeLabel(prefill.date)}
              {prefill.time ? ` · ${prefill.time}` : ""}
            </span>
          )}
          <button
            onClick={closeCompose}
            className="ml-auto text-zinc-400 hover:text-zinc-700"
            aria-label="Cerrar"
          >
            <IconClose width={18} height={18} />
          </button>
        </div>

        <div className="px-5 pb-2 pt-3">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit(e.shiftKey);
              }
            }}
            placeholder="Escribe una tarea… p. ej. «Revisar pricing mañana 16:00»"
            className="w-full bg-transparent text-lg text-ink outline-none placeholder:text-zinc-300"
          />
        </div>

        {/* Parsed preview chips */}
        {(effectiveDate || effectiveTime) && !prefill.date && (
          <div className="flex flex-wrap items-center gap-2 px-5 pb-1 text-[12px]">
            {effectiveDate && (
              <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 font-medium text-accent">
                <IconCalendar width={12} height={12} />
                {relativeLabel(effectiveDate)}
              </span>
            )}
            {effectiveTime && (
              <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 font-medium text-accent">
                <IconClock width={12} height={12} />
                {effectiveTime}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-zinc-100 px-5 py-3">
          <span className="text-[12px] text-zinc-400">Prioridad</span>
          {PRIORITIES.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setPriority(priority === p.key ? null : p.key)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors ${
                priority === p.key
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${p.dot}`} />
              {p.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-3">
            <span
              className={`text-[12px] text-emerald-500 transition-opacity ${
                flash ? "opacity-100" : "opacity-0"
              }`}
            >
              Añadida ✓
            </span>
            <button
              onClick={() => submit(false)}
              disabled={!parsed.title.trim()}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-30"
            >
              Añadir
            </button>
          </div>
        </div>
        <div className="bg-zinc-50 px-5 py-2 text-[11px] text-zinc-400">
          <kbd className="rounded bg-white px-1.5 py-0.5 font-sans shadow-sm">Enter</kbd>{" "}
          para añadir ·{" "}
          <kbd className="rounded bg-white px-1.5 py-0.5 font-sans shadow-sm">Shift</kbd>+
          <kbd className="rounded bg-white px-1.5 py-0.5 font-sans shadow-sm">Enter</kbd>{" "}
          para añadir y seguir
        </div>
      </div>
    </div>
  );
}
