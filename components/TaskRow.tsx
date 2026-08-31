"use client";

import { addDays, relativeLabel, startOfWeek, todayYMD } from "@/lib/dates";
import { useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { Checkbox, PriorityDot, TagPill } from "./bits";
import { IconClock, IconRepeat } from "./icons";
import { useUI } from "./ui-context";

export function TaskRow({
  task,
  showDate = false,
  hideTime = false,
}: {
  task: Task;
  showDate?: boolean;
  hideTime?: boolean;
}) {
  const { toggleDone, update } = useStore();
  const { openTask } = useUI();
  const done = task.status === "done";

  const snooze = (date: string) => update(task.id, { date, status: "todo" });

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/taskid", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => openTask(task.id)}
      className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white hover:shadow-card"
    >
      <Checkbox done={done} onToggle={() => toggleDone(task.id)} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`truncate text-[15px] leading-tight ${
              done ? "text-zinc-400 line-through" : "text-ink"
            }`}
          >
            {task.title}
          </span>
          {task.recurrence && (
            <IconRepeat width={13} height={13} className="shrink-0 text-zinc-400" />
          )}
        </div>
        {(task.tags.length > 0 || (showDate && task.date)) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {showDate && task.date && (
              <span className="text-[11px] font-medium text-zinc-400">
                {relativeLabel(task.date)}
              </span>
            )}
            {task.tags.map((t) => (
              <TagPill key={t} tag={t} />
            ))}
          </div>
        )}
      </div>

      {/* Quick snooze on hover (desktop) */}
      <div className="hidden shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            snooze(addDays(todayYMD(), 1));
          }}
          className="rounded-md px-2 py-1 text-[11px] font-medium text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          title="Posponer a mañana"
        >
          Mañana
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            snooze(addDays(startOfWeek(todayYMD()), 7));
          }}
          className="rounded-md px-2 py-1 text-[11px] font-medium text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          title="Posponer a la próxima semana"
        >
          Próx. semana
        </button>
      </div>

      {task.time && !hideTime && (
        <span className="flex shrink-0 items-center gap-1 text-[13px] font-medium tabular-nums text-zinc-500">
          <IconClock width={13} height={13} />
          {task.time}
        </span>
      )}
      <PriorityDot priority={task.priority} />
    </div>
  );
}
