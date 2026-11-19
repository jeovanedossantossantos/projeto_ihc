import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import WeekAgenda from "../components/WeekAgenda";
import { addDays, shortDate, weekDays } from "../utils";

export default function CalendarPage() {
  const [offset, setOffset] = useState(0);
  const base = new Date();
  base.setDate(base.getDate() + offset * 7);
  const days = weekDays(base);

  return (
    <div className="page wide">
      <header className="page-header">
        <div>
          <h1 className="page-title">Calendário</h1>
          <p className="muted small">Mentorias, entregas e suas tarefas da semana</p>
        </div>
        <div className="week-nav">
          <button className="icon-btn bordered" onClick={() => setOffset((o) => o - 1)} aria-label="Semana anterior"><ChevronLeft size={18} /></button>
          <span className="small strong" aria-live="polite">{shortDate(days[0])} – {shortDate(days[6])}</span>
          <button className="icon-btn bordered" onClick={() => setOffset((o) => o + 1)} aria-label="Próxima semana"><ChevronRight size={18} /></button>
        </div>
      </header>
      {offset !== 0 && <button className="link-sm self-start" onClick={() => setOffset(0)}>Voltar para esta semana</button>}
      <div className="card agenda-card">
        <WeekAgenda base={new Date(addDays(offset * 7) + "T12:00")} />
      </div>
      <p className="legend small muted">
        <span className="legend-item kind-mentoria">Mentoria</span>
        <span className="legend-item kind-entrega">Entrega</span>
        <span className="legend-item kind-tarefa">Tarefa</span>
      </p>
    </div>
  );
}
