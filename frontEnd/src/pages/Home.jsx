import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, GraduationCap, Lightbulb, Search, Timer, TrendingUp, Users, Video } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { usePrefs } from "../context/PrefsContext";
import { usePomodoro } from "../context/PomodoroContext";
import { useToast } from "../context/ToastContext";
import { MENTORS, TIPS } from "../data/mock";
import { Avatar, EmptyState, Stars } from "../components/ui";
import { NotificationBell, upcomingBookings } from "../components/AppShell";
import GroupCard from "../components/GroupCard";
import WeekAgenda from "../components/WeekAgenda";
import { daysUntil, firstName, formatLongDate, greeting, groupProgress, toISODate } from "../utils";

function NextMentoring({ booking }) {
  const toast = useToast();
  const navigate = useNavigate();
  if (!booking) {
    return (
      <div className="hero hero-empty">
        <p className="hero-label">Próxima mentoria</p>
        <h2>Nenhuma mentoria agendada</h2>
        <p>Encontre alguém para te ajudar na próxima prova.</p>
        <div className="hero-actions">
          <Link to="/mentores" className="btn btn-on-dark">Encontrar mentor</Link>
        </div>
      </div>
    );
  }
  const mentor = MENTORS.find((m) => m.id === booking.mentorId);
  const isToday = daysUntil(booking.date) === 0;
  return (
    <div className="hero">
      <div className="hero-art" aria-hidden="true"><BookOpen size={34} /></div>
      <p className="hero-label">
        Próxima mentoria · {formatLongDate(booking.date)} {booking.time}
      </p>
      <h2>{booking.subject}</h2>
      <p>
        com {mentor?.name} · {booking.mode === "online" ? "Online" : "Presencial"} · 50 minutos
      </p>
      <div className="hero-mentor d-only">
        <Avatar name={mentor?.name} size={30} />
        <span>
          <Stars value={mentor?.rating || 0} /> · {mentor?.sessions} mentorias dadas
        </span>
      </div>
      <div className="hero-actions">
        <button
          className="btn btn-on-dark"
          onClick={() => toast(isToday ? "Abrindo sala da mentoria…" : "A sala abre 10 min antes do horário.", "info")}
        >
          <Video size={16} aria-hidden="true" /> Entrar na sala
        </button>
        <button className="btn btn-ghost-dark" onClick={() => navigate(`/mentores/${booking.mentorId}/agendar?reagendar=${booking.id}`)}>
          Reagendar
        </button>
      </div>
    </div>
  );
}

function TipCard() {
  const { prefs } = usePrefs();
  const { session, label, start, stop } = usePomodoro();
  const tip = TIPS[new Date().getDate() % TIPS.length];
  return (
    <aside className="tip-card" aria-label="Dica do dia">
      <span className="tip-icon" aria-hidden="true"><Lightbulb size={20} /></span>
      <div className="grow">
        <strong>Dica do dia</strong>
        <p>{tip}</p>
        <p className="tip-extra">
          Você estuda melhor entre <strong>14h e 16h</strong>, baseado no seu histórico.
        </p>
      </div>
      {prefs.pomodoro && (
        <button className="btn btn-amber btn-sm" onClick={session ? stop : start}>
          <Timer size={15} aria-hidden="true" /> {session ? `Parar · ${label}` : "Começar foco"}
        </button>
      )}
    </aside>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { bookings, groups, studyHours } = useData();
  const toast = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const upcoming = upcomingBookings(bookings);
  const today = toISODate(new Date());
  const todayCount = upcoming.filter((b) => b.date === today).length;
  const activeGroups = groups.filter((g) => g.status === "ativo").sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const myWeekTasks = activeGroups
    .flatMap((g) => g.tasks)
    .filter((t) => t.assignee === "Você" && t.status !== "done" && daysUntil(t.due) <= 7).length;
  const openTasks = activeGroups.flatMap((g) => g.tasks).filter((t) => t.status !== "done").length;
  const avgProgress = activeGroups.length
    ? Math.round(activeGroups.reduce((s, g) => s + groupProgress(g), 0) / activeGroups.length)
    : 0;
  const month = today.slice(0, 7);
  const monthBookings = bookings.filter((b) => b.date.startsWith(month)).length;

  return (
    <div className="page home">
      <header className="home-header m-only">
        <Link to="/perfil" className="home-user">
          <Avatar name={user?.name} size={42} />
          <span>
            <small>{greeting()},</small>
            <strong>{firstName(user?.name)} 👋</strong>
          </span>
        </Link>
        <NotificationBell />
      </header>

      <div className="d-only">
        <h1 className="page-title">
          {greeting()}, {firstName(user?.name)} 👋
        </h1>
        <p className="muted">
          Você tem <strong className="text-primary">{todayCount} mentoria{todayCount === 1 ? "" : "s"}</strong> hoje e{" "}
          <strong className="text-danger">{myWeekTasks} tarefa{myWeekTasks === 1 ? "" : "s"}</strong> pra entregar essa semana.
        </p>
      </div>

      <form
        className="search m-only"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          navigate(`/mentores${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
        }}
      >
        <Search size={18} aria-hidden="true" />
        <input placeholder="Buscar mentor, matéria…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar" />
      </form>

      <div className="home-top">
        <NextMentoring booking={upcoming[0]} />
        <div className="stat-grid d-only">
          <div className="stat-card">
            <span className="overline">Mentorias</span>
            <strong>{bookings.length}</strong>
            <small className="text-success"><TrendingUp size={12} aria-hidden="true" /> +{monthBookings} este mês</small>
          </div>
          <div className="stat-card">
            <span className="overline">Grupos ativos</span>
            <strong>{activeGroups.length}</strong>
            <small>{openTasks} tarefas abertas</small>
          </div>
          <div className="stat-card">
            <span className="overline">Progresso</span>
            <strong>{avgProgress}%</strong>
            <small>média dos trabalhos</small>
          </div>
          <div className="stat-card">
            <span className="overline">Horas de estudo</span>
            <strong>{studyHours}h</strong>
            <small>esta semana</small>
          </div>
        </div>
      </div>

      <section className="m-only">
        <h2 className="section-title">Ações rápidas</h2>
        <div className="quick-actions">
          <Link to="/mentores" className="quick-card">
            <span className="quick-icon tone-indigo"><GraduationCap size={20} aria-hidden="true" /></span>
            <strong>Mentores</strong>
            <small>{MENTORS.filter((m) => m.online).length} online</small>
          </Link>
          <Link to="/grupos" className="quick-card">
            <span className="quick-icon tone-green"><Users size={20} aria-hidden="true" /></span>
            <strong>Grupos</strong>
            <small>{activeGroups.length} ativos</small>
          </Link>
          <button className="quick-card" onClick={() => toast("Biblioteca de materiais em breve.", "info")}>
            <span className="quick-icon tone-amber"><BookOpen size={20} aria-hidden="true" /></span>
            <strong>Materiais</strong>
            <small>12 novos</small>
          </button>
        </div>
      </section>

      <section>
        <div className="section-row">
          <h2 className="section-title">Meus trabalhos</h2>
          <Link to="/grupos" className="link-sm">Ver todos <ChevronRight size={14} aria-hidden="true" /></Link>
        </div>
        {activeGroups.length ? (
          <div className="works">
            {activeGroups.slice(0, 3).map((g) => (
              <GroupCard key={g.id} group={g} variant="compact" />
            ))}
          </div>
        ) : (
          <div className="card">
            <EmptyState title="Nenhum trabalho ativo" action={<Link to="/grupos/novo" className="btn btn-soft btn-sm">Criar grupo</Link>} />
          </div>
        )}
      </section>

      <div className="home-bottom">
        <section className="d-only card agenda-card">
          <div className="section-row">
            <h2 className="section-title">Agenda da semana</h2>
            <Link to="/calendario" className="link-sm">Abrir calendário <ChevronRight size={14} aria-hidden="true" /></Link>
          </div>
          <WeekAgenda />
        </section>
        <TipCard />
      </div>
    </div>
  );
}
