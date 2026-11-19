import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { MENTORS } from "../data/mock";
import { WEEKDAY_SHORT, parseISODate, toISODate, weekDays } from "../utils";

/** Eventos da semana: mentorias, entregas de grupos e minhas tarefas. */
export function useAgenda(days) {
  const { bookings, groups } = useData();
  const set = new Set(days);
  const events = [];
  for (const b of bookings) {
    if (!set.has(b.date)) continue;
    const m = MENTORS.find((x) => x.id === b.mentorId);
    events.push({ id: b.id, date: b.date, time: b.time, kind: "mentoria", label: "Mentoria", title: b.subject.split("·")[0].trim(), sub: m?.name, to: `/mentores/${b.mentorId}` });
  }
  for (const g of groups) {
    if (g.status !== "ativo") continue;
    if (set.has(g.dueDate)) {
      events.push({ id: `due-${g.id}`, date: g.dueDate, time: "23:59", kind: "entrega", label: "Entrega", title: g.name, to: `/grupos/${g.id}` });
    }
    for (const t of g.tasks) {
      if (t.assignee === "Você" && t.status !== "done" && set.has(t.due)) {
        events.push({ id: t.id, date: t.due, time: "", kind: "tarefa", label: "Tarefa", title: t.title, sub: g.name, to: `/grupos/${g.id}` });
      }
    }
  }
  return events.sort((a, b) => (a.date + (a.time || "99")).localeCompare(b.date + (b.time || "99")));
}

export default function WeekAgenda({ base = new Date() }) {
  const days = weekDays(base);
  const events = useAgenda(days);
  const today = toISODate(new Date());

  return (
    <div className="agenda" role="list">
      {days.map((iso) => {
        const d = parseISODate(iso);
        const dayEvents = events.filter((e) => e.date === iso);
        return (
          <div key={iso} className={`agenda-day ${iso === today ? "is-today" : ""}`} role="listitem">
            <div className="agenda-head">
              <span>{WEEKDAY_SHORT[d.getDay()]}</span> {String(d.getDate()).padStart(2, "0")}
              {iso === today && <span className="sr-only"> (hoje)</span>}
            </div>
            <div className="agenda-events">
              {dayEvents.map((e) => (
                <Link key={e.id} to={e.to} className={`agenda-event kind-${e.kind}`}>
                  {e.time && <strong>{e.time}</strong>}
                  <span className="agenda-kind">{e.label}</span>
                  <span className="agenda-title">{e.title}</span>
                </Link>
              ))}
              {!dayEvents.length && <span className="agenda-empty">—</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
