import type { Priority, Task } from "./types";

export function taskPriorityTone(priority: Priority) {
  if (priority === "CRITICAL") return "red" as const;
  if (priority === "HIGH" || priority === "MEDIUM") return "yellow" as const;
  return "neutral" as const;
}

export function taskStatusTone(status: Task["status"]) {
  if (status === "DONE") return "green" as const;
  if (status === "IN_PROGRESS") return "blue" as const;
  return "neutral" as const;
}

function parseLooseDue(value: string, now: Date) {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("today")) return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0);
  if (lower.startsWith("tomorrow")) return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 17, 0);
  const shortDate = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3})(?:\s+(\d{4}))?/);
  if (shortDate) {
    const year = shortDate[3] ? Number(shortDate[3]) : now.getFullYear();
    const parsed = new Date(`${shortDate[1]} ${shortDate[2]} ${year} 17:00`);
    if (!Number.isNaN(+parsed)) return parsed;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(+parsed) ? null : parsed;
}

export function taskDueDate(task: Pick<Task, "due" | "dueAt">, now = new Date()) {
  if (task.dueAt) {
    const exact = new Date(task.dueAt);
    if (!Number.isNaN(+exact)) return exact;
  }
  return parseLooseDue(task.due, now);
}

export function formatTaskDue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(+date)) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date).replace(",", " ·");
}

export function toLocalDateTimeInput(task?: Pick<Task, "due" | "dueAt">) {
  const date = task ? taskDueDate(task) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const target = date ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
  const shifted = new Date(target.getTime() - target.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

export function taskDueBucket(task: Task, now = new Date()) {
  if (task.status === "DONE") return "DONE" as const;
  const due = taskDueDate(task, now);
  if (!due) return "UPCOMING" as const;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  if (dueDay < today) return "OVERDUE" as const;
  if (+dueDay === +today) return "TODAY" as const;
  return "UPCOMING" as const;
}
