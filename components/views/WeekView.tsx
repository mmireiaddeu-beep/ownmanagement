"use client";

import { useState } from "react";
import {
  MONTHS_LONG,
  WEEKDAYS_SHORT,
  addDays,
  dayNum,
  formatShort,
  fromYMD,
  isToday,
  isWeekend,
  startOfWeek,
  todayYMD,
  weekDays,
} from "@/lib/dates";
import { sortByTime, useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { Checkbox, PriorityDot } from "../bits";
import { IconChevronLeft, IconChevronRight, IconPlus } from "../icons";
import { useUI } from "../ui-context";

export function WeekView() {
  const { tasks, ready, update, toggleDone } = useStore();
  const { openCompose, openTask } = useUI();
  const [anchor, setAnchor] = useState(startOfWeek(todayYMD()));
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const days = weekDays(anchor);
  const rangeStart = fromYMD(days[0]);
  const rangeEnd = fromYMD(days[6]);

  const byDay = (ymd: string): Task[] =>
    tasks
      .filter((t) => t.date === ymd && t.status !== "done")
      .sort(sortByTime);

  const doneByDay = (ymd: string): number =>
    tasks.filter((t) => t.date === ymd && t.status === "done").length;

  const onDrop = (ymd: string, e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/taskid");
    if (id) update(id, { date: ymd, status: "todo" });
    setDropTarget(null);
  };

  if (!ready) return <div className="h-40" />;

  const rangeLabel =
    rangeStart.getMonth() === rangeEnd.getMonth()
      ? `${rangeStart.getDate()}–${rangeEnd.getDate()} ${MONTHS_LONG[rangeStart.getMonth()]}`
      : `${formatShort(days[0])} – ${formatShort(days[6])}`;

  return (
    <div className="animate-fadeIn">
      <div className="mb-5 flex items-center gap-3">
        <div>
          <h1 className="font-serif text-3xl capitalize text-ink">Semana</h1>
          <p className="mt-0.5 text-sm text-zinc-400">{rangeLabel}</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <NavBtn onClick={() => setAnchor(addDays(anchor, -7))}>
            <IconChevronLeft width={18} height={18} />
          </NavBtn>
          <button
            onClick={() => setAnchor(startOfWeek(todayYMD()))}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100"
          >
            Hoy
          </button>
          <NavBtn onClick={() => setAnchor(addDays(anchor, 7))}>
            <IconChevronRight width={18} height={18} />
          </NavBtn>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
        {days.map((ymd) => {
          const d = fromYMD(ymd);
          const list = byDay(ymd);
          const doneCount = doneByDay(ymd);
          const today = isToday(ymd);
          const active = dropTarget === ymd;
          return (
            <div
              key={ymd}
              onDragOver={(e) => {
                e.preventDefault();
                setDropTarget(ymd);
              }}
              onDragLeave={() => setDropTarget((c) => (c === ymd ? null : c))}
              onDrop={(e) => onDrop(ymd, e)}
              className={`flex min-h-[8rem] flex-col rounded-xl border p-2 transition-colors sm:min-h-[22rem] ${
                active
                  ? "border-accent bg-accent-soft"
                  : today
                    ? "border-accent/40 bg-white"
                    : isWeekend(ymd)
                      ? "border-zinc-100 bg-zinc-50/50"
                      : "border-zinc-100 bg-white/60"
              }`}
            >
              <div className="mb-1.5 flex items-baseline justify-between px-1">
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    today ? "text-accent" : "text-zinc-400"
                  }`}
                >
                  {WEEKDAYS_SHORT[d.getDay()]}
                </span>
                <span
                  className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-sm font-semibold tabular-nums ${
                    today ? "bg-accent text-white" : "text-zinc-600"
                  }`}
                >
                  {dayNum(ymd)}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-1">
                {list.map((t) => (
                  <button
                    key={t.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/taskid", t.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() => openTask(t.id)}
                    className="group flex items-start gap-1.5 rounded-lg bg-white px-2 py-1.5 text-left shadow-card transition-shadow hover:shadow-lift"
                  >
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDone(t.id);
                      }}
                      className="pt-0.5"
                    >
                      <Checkbox size="sm" done={false} onToggle={() => toggleDone(t.id)} />
                    </span>
                    <span className="line-clamp-2 min-w-0 flex-1 text-[13px] leading-snug text-ink">
                      {t.time && (
                        <span className="mr-1 font-semibold tabular-nums text-zinc-400">
                          {t.time}
                        </span>
                      )}
                      {t.title}
                    </span>
                    <PriorityDot priority={t.priority} />
                  </button>
                ))}
              </div>

              <button
                onClick={() => openCompose({ date: ymd })}
                className="mt-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-[12px] text-zinc-300 transition-colors hover:bg-zinc-50 hover:text-zinc-500"
                aria-label="Añadir tarea"
              >
                <IconPlus width={14} height={14} />
              </button>

              {doneCount > 0 && (
                <span className="mt-1 px-1 text-[10px] text-zinc-300">
                  ✓ {doneCount}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100"
    >
      {children}
    </button>
  );
}
