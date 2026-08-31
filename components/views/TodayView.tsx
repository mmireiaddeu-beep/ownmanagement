"use client";

import Link from "next/link";
import {
  MONTHS_LONG,
  WEEKDAYS_LONG,
  capitalize,
  fromYMD,
  isPast,
  todayYMD,
} from "@/lib/dates";
import { sortByTime, useStore } from "@/lib/store";
import { TaskRow } from "../TaskRow";
import { Checkbox } from "../bits";
import { useUI } from "../ui-context";
import { IconPlus } from "../icons";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 14) return "Buenos días";
  if (h < 21) return "Buenas tardes";
  return "Buenas noches";
}

export function TodayView() {
  const { tasks, ready, update } = useStore();
  const { openCompose } = useUI();
  const today = todayYMD();
  const d = fromYMD(today);

  const active = tasks.filter((t) => t.status !== "done");
  const todays = active.filter((t) => t.date === today);
  const timed = todays.filter((t) => t.time).sort(sortByTime);
  const untimed = todays.filter((t) => !t.time).sort(sortByTime);
  const overdue = active
    .filter((t) => t.date && isPast(t.date))
    .sort((a, b) => (a.date! < b.date! ? -1 : 1));
  const later = active.filter((t) => t.date && t.date > today).length;
  const doneToday = tasks.filter((t) => t.status === "done" && t.date === today);

  if (!ready) return <div className="h-40" />;

  const empty = todays.length === 0 && overdue.length === 0;

  return (
    <div className="animate-fadeIn">
      {/* Header — like a paper agenda page */}
      <div className="mb-8">
        <div className="font-serif text-sm uppercase tracking-[0.2em] text-zinc-400">
          {WEEKDAYS_LONG[d.getDay()]}
        </div>
        <h1 className="mt-1 font-serif text-4xl text-ink sm:text-5xl">
          {d.getDate()} {capitalize(MONTHS_LONG[d.getMonth()])}
        </h1>
        <p className="mt-3 text-[15px] text-zinc-500">{greeting()}, Mireia.</p>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-3">
          <div className="mb-1 flex items-center justify-between px-2">
            <h2 className="text-[12px] font-semibold uppercase tracking-wider text-amber-600">
              Atrasadas · {overdue.length}
            </h2>
            <button
              onClick={() => overdue.forEach((t) => update(t.id, { date: today }))}
              className="text-[12px] font-medium text-amber-700 hover:underline"
            >
              Mover todo a hoy
            </button>
          </div>
          <div className="flex flex-col">
            {overdue.map((t) => (
              <TaskRow key={t.id} task={t} showDate />
            ))}
          </div>
        </section>
      )}

      {empty ? (
        <EmptyToday onAdd={() => openCompose({ date: today })} />
      ) : (
        <>
          {/* Timed */}
          {timed.length > 0 && (
            <section className="mb-2">
              {timed.map((t) => (
                <div key={t.id} className="flex items-stretch gap-3">
                  <div className="w-14 shrink-0 pt-3 text-right">
                    <span className="text-[13px] font-semibold tabular-nums text-zinc-400">
                      {t.time}
                    </span>
                  </div>
                  <div className="relative flex-1 border-l border-zinc-200 pl-3">
                    <span className="absolute -left-[5px] top-4 h-2.5 w-2.5 rounded-full border-2 border-accent bg-paper" />
                    <TaskRow task={t} hideTime />
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Untimed */}
          {untimed.length > 0 && (
            <section className="mt-4">
              <div className="mb-1 flex items-center gap-3 px-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Sin hora
                </span>
                <span className="h-px flex-1 bg-zinc-200" />
              </div>
              <div className="flex flex-col">
                {untimed.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Add inline */}
      <button
        onClick={() => openCompose({ date: today })}
        className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-400 transition-colors hover:bg-white hover:text-zinc-600"
      >
        <IconPlus width={16} height={16} />
        Añadir tarea para hoy
      </button>

      {/* Footer: more later + done today */}
      <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-zinc-400">
        {later > 0 && (
          <Link href="/week" className="hover:text-accent">
            {later} {later === 1 ? "tarea" : "tareas"} más adelante →
          </Link>
        )}
        {doneToday.length > 0 && (
          <span className="text-zinc-400">✓ {doneToday.length} completadas hoy</span>
        )}
      </div>

      {doneToday.length > 0 && (
        <details className="mt-4 rounded-xl">
          <summary className="cursor-pointer list-none px-3 text-[12px] font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-600">
            Completadas hoy
          </summary>
          <div className="mt-1 opacity-70">
            {doneToday.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function EmptyToday({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-200 py-14 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Checkbox done={false} onToggle={() => {}} />
      </div>
      <p className="text-[15px] font-medium text-ink">Nada para hoy.</p>
      <p className="mt-1 text-sm text-zinc-400">
        Disfruta del día o añade algo que tengas en mente.
      </p>
      <button
        onClick={onAdd}
        className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        Añadir tarea
      </button>
    </div>
  );
}
