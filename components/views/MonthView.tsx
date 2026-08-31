"use client";

import { useState } from "react";
import {
  WEEKDAYS_SHORT,
  addMonths,
  dayNum,
  formatMonthYear,
  fromYMD,
  isToday,
  isWeekend,
  monthGrid,
  monthOf,
  todayYMD,
} from "@/lib/dates";
import { sortByTime, useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { PriorityDot } from "../bits";
import { IconChevronLeft, IconChevronRight } from "../icons";
import { useUI } from "../ui-context";

export function MonthView() {
  const { tasks, ready, update } = useStore();
  const { openCompose, openTask } = useUI();
  const [anchor, setAnchor] = useState(todayYMD());
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const cells = monthGrid(anchor);
  const activeMonth = monthOf(anchor);

  const byDay = (ymd: string): Task[] =>
    tasks.filter((t) => t.date === ymd && t.status !== "done").sort(sortByTime);

  const onDrop = (ymd: string, e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/taskid");
    if (id) update(id, { date: ymd, status: "todo" });
    setDropTarget(null);
  };

  if (!ready) return <div className="h-40" />;

  return (
    <div className="animate-fadeIn">
      <div className="mb-5 flex items-center gap-3">
        <h1 className="font-serif text-3xl text-ink">{formatMonthYear(anchor)}</h1>
        <div className="ml-auto flex items-center gap-1">
          <NavBtn onClick={() => setAnchor(addMonths(anchor, -1))}>
            <IconChevronLeft width={18} height={18} />
          </NavBtn>
          <button
            onClick={() => setAnchor(todayYMD())}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100"
          >
            Hoy
          </button>
          <NavBtn onClick={() => setAnchor(addMonths(anchor, 1))}>
            <IconChevronRight width={18} height={18} />
          </NavBtn>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200">
        {WEEKDAYS_SHORT.slice(1)
          .concat(WEEKDAYS_SHORT[0])
          .map((w) => (
            <div
              key={w}
              className="bg-paper py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-400"
            >
              <span className="hidden sm:inline">{w}</span>
              <span className="sm:hidden">{w.charAt(0)}</span>
            </div>
          ))}

        {cells.map((ymd) => {
          const list = byDay(ymd);
          const inMonth = monthOf(ymd) === activeMonth;
          const today = isToday(ymd);
          const active = dropTarget === ymd;
          const shown = list.slice(0, 3);
          const extra = list.length - shown.length;
          return (
            <div
              key={ymd}
              onDragOver={(e) => {
                e.preventDefault();
                setDropTarget(ymd);
              }}
              onDragLeave={() => setDropTarget((c) => (c === ymd ? null : c))}
              onDrop={(e) => onDrop(ymd, e)}
              onClick={() => openCompose({ date: ymd })}
              className={`min-h-[5.5rem] cursor-pointer p-1.5 transition-colors sm:min-h-[7rem] ${
                active
                  ? "bg-accent-soft"
                  : inMonth
                    ? isWeekend(ymd)
                      ? "bg-zinc-50/60"
                      : "bg-paper"
                    : "bg-zinc-50/40"
              }`}
            >
              <div className="mb-1 flex justify-end">
                <span
                  className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[12px] font-semibold tabular-nums ${
                    today
                      ? "bg-accent text-white"
                      : inMonth
                        ? "text-zinc-600"
                        : "text-zinc-300"
                  }`}
                >
                  {dayNum(ymd)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {shown.map((t) => (
                  <button
                    key={t.id}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.setData("text/taskid", t.id);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openTask(t.id);
                    }}
                    className="flex items-center gap-1 truncate rounded-md bg-white px-1.5 py-0.5 text-left text-[11px] text-ink shadow-card hover:shadow-lift"
                  >
                    <PriorityDot priority={t.priority} />
                    {t.time && (
                      <span className="font-semibold tabular-nums text-zinc-400">
                        {t.time.slice(0, 5)}
                      </span>
                    )}
                    <span className="truncate">{t.title}</span>
                  </button>
                ))}
                {extra > 0 && (
                  <span className="px-1 text-[10px] font-medium text-zinc-400">
                    +{extra} más
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[12px] text-zinc-400">
        Haz clic en un día para añadir · arrastra una tarea para moverla
      </p>
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
