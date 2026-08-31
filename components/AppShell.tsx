"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import {
  IconGrid,
  IconInbox,
  IconList,
  IconPlus,
  IconSun,
  IconCalendar,
} from "./icons";
import { QuickAdd } from "./QuickAdd";
import { TaskDrawer } from "./TaskDrawer";
import { useUI } from "./ui-context";

const NAV = [
  { href: "/", label: "Hoy", icon: IconSun },
  { href: "/week", label: "Semana", icon: IconCalendar },
  { href: "/month", label: "Mes", icon: IconGrid },
  { href: "/inbox", label: "Inbox", icon: IconInbox },
  { href: "/all", label: "Todas", icon: IconList },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { openCompose } = useUI();
  const { tasks, cloud, syncError } = useStore();

  const inboxCount = tasks.filter((t) => t.status === "inbox").length;

  // Global keyboard shortcut: "n" or "c" opens quick add.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing =
        el?.tagName === "INPUT" ||
        el?.tagName === "TEXTAREA" ||
        el?.isContentEditable;
      if (!typing && (e.key === "n" || e.key === "c")) {
        e.preventDefault();
        openCompose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openCompose]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="min-h-screen">
      {/* Top bar (desktop) */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-serif text-lg text-ink">
            <span className="text-accent">◆</span> Agenda
          </Link>
          <span
            title={
              !cloud
                ? "Guardado en este navegador (sin sincronización)"
                : syncError
                  ? "Error de sincronización con Supabase — revisa que la tabla exista. Tus datos siguen guardados en este navegador."
                  : "Sincronizado con Supabase"
            }
            className={`hidden h-1.5 w-1.5 rounded-full sm:block ${
              !cloud ? "bg-zinc-300" : syncError ? "bg-amber-400" : "bg-emerald-400"
            }`}
          />

          <nav className="ml-2 hidden items-center gap-1 sm:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-ink"
                }`}
              >
                {item.label}
                {item.href === "/inbox" && inboxCount > 0 && (
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      isActive(item.href)
                        ? "bg-white/20 text-white"
                        : "bg-accent-soft text-accent"
                    }`}
                  >
                    {inboxCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => openCompose()}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white shadow-card transition-transform hover:scale-[1.02] active:scale-95"
          >
            <IconPlus width={17} height={17} />
            <span className="hidden sm:inline">Nueva tarea</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:px-6 sm:pb-16">{children}</main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-200 bg-white/95 backdrop-blur sm:hidden">
        <div className="flex items-stretch justify-around">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                  active ? "text-accent" : "text-zinc-400"
                }`}
              >
                <Icon width={22} height={22} strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
                {item.href === "/inbox" && inboxCount > 0 && (
                  <span className="absolute right-[22%] top-1 h-1.5 w-1.5 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Floating add (mobile) */}
      <button
        onClick={() => openCompose()}
        className="fixed bottom-16 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lift transition-transform active:scale-90 sm:hidden"
        aria-label="Nueva tarea"
      >
        <IconPlus width={26} height={26} />
      </button>

      <QuickAdd />
      <TaskDrawer />
    </div>
  );
}
