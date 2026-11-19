import { useState } from "react";
import { Link, NavLink, Outlet, matchPath, useLocation, useNavigate } from "react-router-dom";
import {
  Bell, BellOff, BookOpen, CalendarDays, Home, LogOut, MessageSquare, MoreHorizontal, Plus, Search,
  Settings, Timer, User, UserRound, Users, EyeOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { usePrefs } from "../context/PrefsContext";
import { usePomodoro } from "../context/PomodoroContext";
import { useToast } from "../context/ToastContext";
import { MENTORS } from "../data/mock";
import { Avatar, Logo, useDismiss } from "./ui";
import { daysUntil, dueLabel, firstName, formatLongDate, toISODate } from "../utils";

/** Telas de foco: no mobile escondem a navegação inferior. */
const FOCUS_ROUTES = ["/mentores/:id", "/mentores/:id/agendar", "/grupos/novo", "/chat/:kind/:id", "/configuracoes/:section"];

export function upcomingBookings(bookings) {
  const today = toISODate(new Date());
  return bookings
    .filter((b) => b.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

export function useNotifications() {
  const { bookings, groups } = useData();
  const { prefs } = usePrefs();
  if (prefs.muteNotifications) return [];
  const next = upcomingBookings(bookings)[0];
  const mentor = next && MENTORS.find((m) => m.id === next.mentorId);
  return [
    ...(next && prefs.notifyMentoring
      ? [{ id: "n-b", to: "/", text: `Mentoria com ${firstName(mentor?.name)} · ${formatLongDate(next.date)} às ${next.time}` }]
      : []),
    ...(prefs.notifyTasks
      ? groups
          .filter((g) => g.status === "ativo" && daysUntil(g.dueDate) <= 3)
          .map((g) => ({ id: `n-${g.id}`, to: `/grupos/${g.id}`, text: `${g.name}: ${dueLabel(g.dueDate).toLowerCase()}` }))
      : []),
  ];
}

export function NotificationBell() {
  const { prefs } = usePrefs();
  const notifications = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  if (prefs.focusMode) return null;

  return (
    <div className="pop-wrap" ref={ref}>
      <button
        className="icon-btn bordered"
        aria-label={`Notificações${notifications.length ? ` (${notifications.length} novas)` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
      >
        {prefs.muteNotifications ? <BellOff size={19} /> : <Bell size={19} />}
        {notifications.length > 0 && <span className="badge-dot" aria-hidden="true" />}
      </button>
      {open && (
        <div className="popover" role="dialog" aria-label="Notificações">
          <strong>Notificações</strong>
          {prefs.muteNotifications ? (
            <p className="muted">Notificações silenciadas nas configurações.</p>
          ) : notifications.length ? (
            notifications.map((n) => (
              <Link key={n.id} to={n.to} className="pop-item" onClick={() => setOpen(false)}>
                {n.text}
              </Link>
            ))
          ) : (
            <p className="muted">Nada novo por aqui.</p>
          )}
        </div>
      )}
    </div>
  );
}

function PomodoroChip() {
  const { session, label, stop } = usePomodoro();
  if (!session) return null;
  return (
    <button className="pomodoro-chip" onClick={stop} aria-label={`${session.phase === "foco" ? "Foco" : "Pausa"}: ${label} restantes. Clique para encerrar.`}>
      <Timer size={15} aria-hidden="true" /> {session.phase === "foco" ? "Foco" : "Pausa"} · {label}
    </button>
  );
}

function CreateMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const go = (to) => {
    setOpen(false);
    navigate(to);
  };
  return (
    <div className="pop-wrap" ref={ref}>
      <button className="btn btn-primary btn-icon" aria-label="Criar" aria-expanded={open} onClick={() => setOpen((s) => !s)}>
        <Plus size={20} />
      </button>
      {open && (
        <div className="popover menu">
          <button onClick={() => go("/mentores")}><UserRound size={16} /> Agendar mentoria</button>
          <button onClick={() => go("/grupos/novo")}><Users size={16} /> Novo grupo</button>
        </div>
      )}
    </div>
  );
}

function Topbar() {
  const navigate = useNavigate();
  const { prefs, setPref } = usePrefs();
  const [q, setQ] = useState("");
  return (
    <header className="topbar">
      <form
        className="search topbar-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          navigate(`/mentores${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
        }}
      >
        <Search size={17} aria-hidden="true" />
        <input placeholder="Buscar mentor, matéria, grupo…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" />
      </form>
      <div className="topbar-actions">
        <PomodoroChip />
        {prefs.focusMode ? (
          <button className="btn btn-secondary btn-sm" onClick={() => setPref("focusMode", false)}>
            <EyeOff size={15} /> Sair do modo foco
          </button>
        ) : (
          <NotificationBell />
        )}
        <Link to="/configuracoes/acessibilidade" className="icon-btn bordered" aria-label="Configurações">
          <Settings size={19} />
        </Link>
        <CreateMenu />
      </div>
    </header>
  );
}

function UserCard() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div className="user-card pop-wrap" ref={ref}>
      <Avatar name={user?.name} size={36} online />
      <div className="grow min0">
        <strong className="ellipsis">{user?.name}</strong>
        <small className="ellipsis">{user?.email}</small>
      </div>
      <button className="icon-btn sm" aria-label="Menu da conta" aria-expanded={open} onClick={() => setOpen((s) => !s)}>
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className="popover menu up">
          <Link to="/perfil" onClick={() => setOpen(false)}><User size={16} /> Meu perfil</Link>
          <button onClick={logout}><LogOut size={16} /> Sair</button>
        </div>
      )}
    </div>
  );
}

function Sidebar() {
  const { groups, unreadTotal } = useData();
  const { prefs } = usePrefs();
  const toast = useToast();
  const activeGroups = groups.filter((g) => g.status === "ativo").length;
  const badge = (n) => (!prefs.focusMode && n > 0 ? <span className="nav-badge" aria-label={`${n} novos`}>{n}</span> : null);

  return (
    <aside className="sidebar" aria-label="Menu lateral">
      <Link to="/" className="brand">
        <Logo size={34} inverted />
        <span>MentorIA</span>
      </Link>
      <nav className="side-nav" aria-label="Principal">
        <p className="side-label">Principal</p>
        <NavLink to="/" end className="side-item"><Home size={19} /> Início</NavLink>
        <NavLink to="/mentores" className="side-item"><UserRound size={19} /> Mentores</NavLink>
        <NavLink to="/grupos" className="side-item"><Users size={19} /> Grupos {badge(activeGroups)}</NavLink>
        <NavLink to="/chat" className="side-item"><MessageSquare size={19} /> Chat {badge(unreadTotal)}</NavLink>
        <NavLink to="/calendario" className="side-item"><CalendarDays size={19} /> Calendário</NavLink>
        <p className="side-label">Outros</p>
        <button className="side-item" onClick={() => toast("Biblioteca de materiais em breve.", "info")}><BookOpen size={19} /> Materiais</button>
        <NavLink to="/configuracoes" className="side-item"><Settings size={19} /> Configurações</NavLink>
      </nav>
      <UserCard />
    </aside>
  );
}

const MOBILE_TABS = [
  { to: "/", label: "Início", icon: Home, end: true },
  { to: "/mentores", label: "Mentores", icon: UserRound },
  { to: "/grupos", label: "Grupos", icon: Users },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/perfil", label: "Perfil", icon: User },
];

export default function AppShell() {
  const { pathname } = useLocation();
  const { unreadTotal } = useData();
  const { prefs } = usePrefs();
  const focusRoute = FOCUS_ROUTES.some((p) => matchPath(p, pathname));

  return (
    <div className="shell">
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <Sidebar />
      <div className="main">
        <Topbar />
        <main id="conteudo" className={`content ${focusRoute ? "is-focus" : ""}`} tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      {!focusRoute && (
        <nav className="bottom-nav" aria-label="Navegação principal">
          {MOBILE_TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="nav-item" aria-label={label}>
              <span className="nav-icon">
                <Icon size={22} strokeWidth={2} aria-hidden="true" />
                {to === "/chat" && unreadTotal > 0 && !prefs.focusMode && <span className="badge-dot" aria-hidden="true" />}
              </span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
