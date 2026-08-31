"use client";

import { useMemo, useState } from "react";
import { addDays, isPast, startOfWeek, todayYMD } from "@/lib/dates";
import { sortByTime, useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { TaskRow } from "../TaskRow";
import { useUI } from "../ui-context";

type Filter = "open" | "all" | "done";

export function AllView() {
  const { tasks, ready, clearCompleted } = useStore();
  const { openCompose } = useUI();
  const [filter, setFilter] = useState<Filter>("open");
  const [q, setQ] = useState("");

  const today = todayYMD();
  const weekEnd = addDays(startOfWeek(today), 6);

  const groups = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = tasks.filter((t) =>
      query
        ? t.title.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.includes(query))
        : true,
    );
    if (filter === "open") list = list.filter((t) => t.status !== "done");
    if (filter === "done") list = list.filter((t) => t.status === "done");

    const g: { key: string; label: string; items: Task[] }[] = [
      { key: "overdue", label: "Atrasadas", items: [] },
      { key: "today", label: "Hoy", items: [] },
      { key: "tomorrow", label: "Mañana", items: [] },
      { key: "week", label: "Esta semana", items: [] },
      { key: "later", label: "Más adelante", items: [] },
      { key: "none", label: "Sin fecha · Inbox", items: [] },
      { key: "done", label: "Completadas", items: [] },
    ];
    const put = (key: string, t: Task) =>
      g.find((x) => x.key === key)!.items.push(t);

    for (const t of list) {
      if (t.status === "done") {
        put("done", t);
      } else if (!t.date) {
        put("none", t);
      } else if (isPast(t.date)) {
        put("overdue", t);
      } else if (t.date === today) {
        put("today", t);
      } else if (t.date === addDays(today, 1)) {
        put("tomorrow", t);
      } else if (t.date <= weekEnd) {
        put("week", t);
      } else {
        put("later", t);
      }
    }
    for (const grp of g) {
      grp.items.sort((a, b) => {
        if (a.date && b.date && a.date !== b.date) return a.date < b.date ? -1 : 1;
        return sortByTime(a, b);
      });
    }
    return g.filter((grp) => grp.items.length > 0);
  }, [tasks, filter, q, today, weekEnd]);

  if (!ready) return <div className="h-40" />;

  const total = tasks.length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="animate-fadeIn">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl text-ink">Todas</h1>
        <span className="text-sm text-zinc-400">
          {total} en total · {doneCount} hechas
        </span>
        {doneCount > 0 && (
          <button
            onClick={clearCompleted}
            className="ml-auto text-[12px] font-medium text-zinc-400 hover:text-red-500"
          >
            Borrar completadas
          </button>
        )}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar…"
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-zinc-300 focus:border-accent"
        />
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-0.5">
          {(
            [
              ["open", "Abiertas"],
              ["done", "Hechas"],
              ["all", "Todas"],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                filter === key ? "bg-white text-ink shadow-card" : "text-zinc-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 py-14 text-center">
          <p className="text-[15px] font-medium text-ink">Sin resultados.</p>
          <button
            onClick={() => openCompose()}
            className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Nueva tarea
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((grp) => (
            <section key={grp.key}>
              <div className="mb-1 flex items-center gap-3 px-3">
                <h2
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    grp.key === "overdue" ? "text-amber-600" : "text-zinc-400"
                  }`}
                >
                  {grp.label}
                </h2>
                <span className="text-[11px] text-zinc-300">{grp.items.length}</span>
                <span className="h-px flex-1 bg-zinc-100" />
              </div>
              <div className={grp.key === "done" ? "opacity-60" : ""}>
                {grp.items.map((t) => (
                  <TaskRow key={t.id} task={t} showDate={grp.key !== "today"} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
