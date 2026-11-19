export const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
export const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

/** Data local no formato AAAA-MM-DD. */
export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(days, base = new Date()) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function daysUntil(iso) {
  const today = parseISODate(toISODate(new Date()));
  return Math.round((parseISODate(iso) - today) / 86400000);
}

export function formatDM(iso) {
  const d = parseISODate(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatLongDate(iso) {
  const n = daysUntil(iso);
  if (n === 0) return "Hoje";
  if (n === 1) return "Amanhã";
  const d = parseISODate(iso);
  return `${d.getDate()} de ${MONTHS[d.getMonth()].toLowerCase()}`;
}

export function dueLabel(iso) {
  const n = daysUntil(iso);
  if (n < 0) return `Atrasado ${-n} dia${n === -1 ? "" : "s"}`;
  if (n === 0) return "Entrega hoje";
  if (n === 1) return "Entrega amanhã";
  return `Entrega em ${n} dias`;
}

export function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function firstName(name = "") {
  return name.trim().split(/\s+/)[0] || "";
}

/** Progresso ponderado: feito = 100, revisão = 80, fazendo = % da tarefa, a fazer = 0. */
export function taskWeight(task) {
  if (task.status === "done") return 100;
  if (task.status === "review") return 80;
  if (task.status === "doing") return task.progress || 0;
  return 0;
}

export function groupProgress(group) {
  if (!group.tasks.length) return 0;
  return Math.round(group.tasks.reduce((sum, t) => sum + taskWeight(t), 0) / group.tasks.length);
}

export function remainingTasks(group) {
  return group.tasks.filter((t) => t.status !== "done").length;
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

/** Segunda-feira da semana da data, como AAAA-MM-DD. */
export function weekDays(base = new Date()) {
  const d = new Date(base);
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return Array.from({ length: 7 }, (_, i) => addDays(i, d));
}

export const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function shortDate(iso) {
  const d = parseISODate(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
