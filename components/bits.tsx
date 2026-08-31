"use client";

import { useState } from "react";
import type { Priority } from "@/lib/types";
import { IconCheck } from "./icons";

export function PriorityDot({ priority }: { priority: Priority }) {
  if (!priority) return null;
  const color =
    priority === "high"
      ? "bg-red-500"
      : priority === "medium"
        ? "bg-amber-400"
        : "bg-zinc-300";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

export function Checkbox({
  done,
  onToggle,
  size = "md",
}: {
  done: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
}) {
  const [burst, setBurst] = useState(false);
  const dim = size === "sm" ? "h-[18px] w-[18px]" : "h-[22px] w-[22px]";
  return (
    <button
      type="button"
      aria-label={done ? "Marcar como pendiente" : "Completar tarea"}
      onClick={(e) => {
        e.stopPropagation();
        if (!done) {
          setBurst(true);
          setTimeout(() => setBurst(false), 300);
        }
        onToggle();
      }}
      className={`group relative flex ${dim} shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        done
          ? "border-accent bg-accent text-white"
          : "border-zinc-300 bg-white text-transparent hover:border-accent"
      }`}
    >
      <IconCheck
        width={size === "sm" ? 12 : 14}
        height={size === "sm" ? 12 : 14}
        strokeWidth={3}
        className={done ? "animate-pop" : "opacity-0 group-hover:opacity-40"}
      />
      {burst && (
        <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-accent/40" />
      )}
    </button>
  );
}

export function TagPill({ tag }: { tag: string }) {
  return (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
      {tag}
    </span>
  );
}
