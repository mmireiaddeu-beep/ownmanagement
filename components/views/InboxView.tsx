"use client";

import { addDays, startOfWeek, todayYMD } from "@/lib/dates";
import { useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { Checkbox } from "../bits";
import { IconInbox, IconPlus } from "../icons";
import { useUI } from "../ui-context";

export function InboxView() {
  const { tasks, ready, update, toggleDone } = useStore();
  const { openCompose, openTask } = useUI();
  const today = todayYMD();

  const inbox = tasks
    .filter((t) => t.status === "inbox")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const schedule = (t: Task, date: string) =>
    update(t.id, { date, status: "todo" });

  if (!ready) return <div className="h-40" />;

  return (
    <div className="animate-fadeIn">
      <div className="mb-1 flex items-center gap-2">
        <h1 className="font-serif text-3xl text-ink">Inbox</h1>
        {inbox.length > 0 && (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-sm font-semibold text-accent">
            {inbox.length}
          </span>
        )}
      </div>
      <p className="mb-5 text-sm text-zinc-400">
        Captura ahora, decide cuándo hacerlo más tarde.
      </p>

      <button
        onClick={() => openCompose({})}
        className="mb-4 flex w-full items-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 py-3 text-left text-sm text-zinc-400 transition-colors hover:border-accent hover:text-accent"
      >
        <IconPlus width={17} height={17} />
        Añadir algo al inbox…
      </button>

      {inbox.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 py-14 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
            <IconInbox width={24} height={24} />
          </div>
          <p className="text-[15px] font-medium text-ink">Inbox vacío.</p>
          <p className="mt-1 text-sm text-zinc-400">Todo procesado. Buen trabajo.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {inbox.map((t) => (
            <div
              key={t.id}
              onClick={() => openTask(t.id)}
              className="group flex cursor-pointer flex-col gap-2 rounded-xl bg-white px-3 py-3 shadow-card sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Checkbox done={false} onToggle={() => toggleDone(t.id)} />
                <span className="truncate text-[15px] text-ink">{t.title}</span>
              </div>
              <div
                className="flex flex-wrap items-center gap-1.5 pl-9 sm:pl-0"
                onClick={(e) => e.stopPropagation()}
              >
                <SchedBtn label="Hoy" onClick={() => schedule(t, today)} />
                <SchedBtn label="Mañana" onClick={() => schedule(t, addDays(today, 1))} />
                <SchedBtn
                  label="Próx. semana"
                  onClick={() => schedule(t, addDays(startOfWeek(today), 7))}
                />
                <SchedBtn label="Fecha…" onClick={() => openTask(t.id)} muted />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SchedBtn({
  label,
  onClick,
  muted,
}: {
  label: string;
  onClick: () => void;
  muted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors ${
        muted
          ? "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-900 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
