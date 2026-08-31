export type Status = "inbox" | "todo" | "doing" | "done";

export type Priority = "high" | "medium" | "low" | null;

export type RecurrenceFreq = "daily" | "weekly" | "monthly";

export interface Recurrence {
  freq: RecurrenceFreq;
  /** Every X days / weeks / months. */
  interval: number;
  /** For weekly: 0 (Sun) .. 6 (Sat). Empty = same weekday as the task date. */
  weekdays?: number[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  /** Local date "YYYY-MM-DD". null = sin fecha (Inbox / algún día). */
  date: string | null;
  /** "HH:mm" or null. */
  time: string | null;
  notes: string;
  status: Status;
  priority: Priority;
  tags: string[];
  checklist: ChecklistItem[];
  /** ISO timestamp. */
  createdAt: string;
  /** "YYYY-MM-DD" or null. */
  dueDate: string | null;
  recurrence: Recurrence | null;
  /** ISO timestamp or null. */
  completedAt: string | null;
  /** Manual ordering within a day / list. */
  order: number;
}

export const PRIORITY_LABEL: Record<Exclude<Priority, null>, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export const STATUS_LABEL: Record<Status, string> = {
  inbox: "Inbox",
  todo: "Pendiente",
  doing: "En progreso",
  done: "Hecho",
};
