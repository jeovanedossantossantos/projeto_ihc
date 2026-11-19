import { useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CalendarCheck2, ChevronLeft, ChevronRight, MapPin, Video } from "lucide-react";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { MENTORS, TIME_SLOTS } from "../data/mock";
import { Avatar, BackHeader } from "../components/ui";
import { MONTHS, WEEKDAYS, formatLongDate, parseISODate, toISODate } from "../utils";

function Calendar({ value, onChange }) {
  const today = new Date();
  const todayISO = toISODate(today);
  const [view, setView] = useState(() => {
    const base = value ? parseISODate(value) : today;
    return { y: base.getFullYear(), m: base.getMonth() };
  });

  const first = new Date(view.y, view.m, 1);
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const isCurrentMonth = view.y === today.getFullYear() && view.m === today.getMonth();

  const shift = (delta) =>
    setView(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  return (
    <div className="calendar">
      <div className="cal-head">
        <strong aria-live="polite">{MONTHS[view.m]} {view.y}</strong>
        <div>
          <button type="button" className="icon-btn sm" onClick={() => shift(-1)} disabled={isCurrentMonth} aria-label="Mês anterior">
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="icon-btn sm" onClick={() => shift(1)} aria-label="Próximo mês">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="cal-grid">
        {WEEKDAYS.map((w, i) => <span key={i} className="cal-wd" aria-hidden="true">{w}</span>)}
        {cells.map((day, i) => {
          if (!day) return <span key={i} />;
          const iso = toISODate(new Date(view.y, view.m, day));
          return (
            <button
              type="button"
              key={i}
              disabled={iso < todayISO}
              className={`cal-day ${iso === value ? "active" : ""} ${iso === todayISO ? "today" : ""}`}
              onClick={() => onChange(iso)}
              aria-pressed={iso === value}
              aria-label={`${day} de ${MONTHS[view.m].toLowerCase()}${iso === todayISO ? " (hoje)" : ""}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ScheduleMentoring() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { bookings, addBooking, cancelBooking } = useData();
  const mentor = MENTORS.find((m) => m.id === id);
  const rescheduling = bookings.find((b) => b.id === params.get("reagendar"));

  const presetTime = params.get("hoje");
  const [subject, setSubject] = useState(rescheduling?.subject || "");
  const [date, setDate] = useState(presetTime ? toISODate(new Date()) : null);
  const [time, setTime] = useState(presetTime);
  const [mode, setMode] = useState(rescheduling?.mode || "online");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(null);

  if (!mentor) return <Navigate to="/mentores" replace />;

  const now = new Date();
  const isToday = date === toISODate(now);
  const slotDisabled = (t) => {
    if (!mentor.slots.includes(t)) return true;
    if (isToday && Number(t.slice(0, 2)) <= now.getHours()) return true;
    return bookings.some((b) => b.id !== rescheduling?.id && b.mentorId === mentor.id && b.date === date && b.time === t);
  };

  function pickDate(iso) {
    setDate(iso);
    setError("");
    if (time && iso === toISODate(new Date()) && Number(time.slice(0, 2)) <= new Date().getHours()) setTime(null);
  }

  function confirm(e) {
    e.preventDefault();
    if (!subject.trim()) return setError("Descreva o assunto da mentoria.");
    if (!date) return setError("Escolha uma data.");
    if (!time || slotDisabled(time)) return setError("Escolha um horário disponível.");
    if (rescheduling) cancelBooking(rescheduling.id);
    setConfirmed(addBooking({ mentorId: mentor.id, subject: subject.trim(), date, time, mode }));
    toast(rescheduling ? "Mentoria reagendada!" : "Mentoria agendada!");
  }

  const d = date && parseISODate(date);
  const summary = d && time ? ` · ${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()].slice(0, 3)} · ${time}` : "";

  if (confirmed) {
    return (
      <div className="page narrow success-page">
        <span className="success-icon" aria-hidden="true"><CalendarCheck2 size={36} /></span>
        <h1 className="h2">{rescheduling ? "Mentoria reagendada!" : "Mentoria agendada!"}</h1>
        <p className="muted">
          {mentor.name} · {formatLongDate(confirmed.date)} às {confirmed.time}
          <br />
          {confirmed.mode === "online" ? "Online — o link aparece na tela inicial." : `Presencial — Campus ${mentor.institution}.`}
        </p>
        <div className="stack full">
          <Link to="/" className="btn btn-primary btn-lg">Ir para o início</Link>
          <Link to={`/chat/mentor/${mentor.id}`} className="btn btn-secondary btn-lg">Enviar mensagem ao mentor</Link>
        </div>
      </div>
    );
  }

  return (
    <form className="page narrow" onSubmit={confirm} noValidate>
      <BackHeader title={rescheduling ? "Reagendar mentoria" : "Nova mentoria"} />

      <div className="card mentor-pick">
        <Avatar name={mentor.name} size={42} tone={mentor.color} />
        <div className="grow min0">
          <strong>{mentor.name}</strong>
          <p className="muted small"><span aria-hidden="true">★</span> {mentor.rating.toFixed(1)} · {mentor.title.split("·")[1]?.trim()}</p>
        </div>
        <Link to="/mentores" className="link-sm">Trocar</Link>
      </div>

      <label className="field">
        <span className="overline">Assunto</span>
        <input placeholder="Ex.: Derivadas aplicadas" value={subject} onChange={(e) => { setSubject(e.target.value); setError(""); }} maxLength={120} />
      </label>

      <section>
        <h2 className="overline label-gap">Data</h2>
        <Calendar value={date} onChange={pickDate} />
      </section>

      <section>
        <h2 className="overline label-gap">Horário</h2>
        <div className="slots grid4" role="group" aria-label="Horário">
          {TIME_SLOTS.map((t) => (
            <button type="button" key={t} className={`slot ${time === t ? "active" : ""}`} disabled={!date || slotDisabled(t)} aria-pressed={time === t} onClick={() => { setTime(t); setError(""); }}>
              {t}
            </button>
          ))}
        </div>
        {!date && <p className="hint">Selecione uma data para ver os horários.</p>}
      </section>

      <section>
        <h2 className="overline label-gap">Modalidade</h2>
        <div className="mode-row">
          {[
            ["online", "Online", "Videochamada", Video],
            ["presencial", "Presencial", `Campus ${mentor.institution}`, MapPin],
          ].map(([key, label, sub, Icon]) => (
            <button
              type="button"
              key={key}
              className={`mode ${mode === key ? "active" : ""}`}
              onClick={() => setMode(key)}
              aria-pressed={mode === key}
              disabled={!mentor.modes.includes(key)}
            >
              <strong><Icon size={16} aria-hidden="true" /> {label}</strong>
              <small>{mentor.modes.includes(key) ? sub : "Indisponível"}</small>
            </button>
          ))}
        </div>
      </section>

      {error && <div className="alert" role="alert">{error}</div>}

      <button className="btn btn-primary btn-lg">Confirmar{summary}</button>
    </form>
  );
}
