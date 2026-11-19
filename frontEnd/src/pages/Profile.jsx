import { Link } from "react-router-dom";
import { Accessibility, Bell, ChevronRight, Globe, LogOut, RotateCcw, Shield, User, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { MENTORS } from "../data/mock";
import { Avatar, EmptyState } from "../components/ui";
import { upcomingBookings } from "../components/AppShell";
import { formatLongDate } from "../utils";

export const SETTINGS_SECTIONS = [
  { key: "conta", label: "Conta", icon: User },
  { key: "notificacoes", label: "Notificações", icon: Bell },
  { key: "privacidade", label: "Privacidade", icon: Shield },
  { key: "acessibilidade", label: "Acessibilidade", icon: Accessibility },
  { key: "idioma", label: "Idioma", icon: Globe },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const { bookings, groups, cancelBooking, resetData } = useData();
  const toast = useToast();

  const upcoming = upcomingBookings(bookings);
  const doneTasks = groups.flatMap((g) => g.tasks).filter((t) => t.status === "done" && t.assignee === "Você").length;

  return (
    <div className="page narrow">
      <h1 className="page-title">Perfil</h1>

      <div className="profile-hero">
        <Avatar name={user?.name} size={84} />
        <h2 className="h3">{user?.name}</h2>
        <p className="muted">{user?.email}</p>
      </div>

      <div className="stats">
        <div><strong>{upcoming.length}</strong><span>Mentorias</span></div>
        <div><strong>{groups.filter((g) => g.status === "ativo").length}</strong><span>Grupos ativos</span></div>
        <div><strong>{doneTasks}</strong><span>Tarefas feitas</span></div>
      </div>

      <section>
        <h2 className="section-title">Mentorias agendadas</h2>
        {upcoming.length ? (
          <div className="card list-card">
            {upcoming.map((b) => {
              const m = MENTORS.find((x) => x.id === b.mentorId);
              return (
                <div key={b.id} className="list-row">
                  <Avatar name={m?.name} size={34} tone={m?.color} />
                  <div className="grow min0">
                    <strong className="small">{b.subject}</strong>
                    <p className="muted small">{m?.name} · {formatLongDate(b.date)} às {b.time}</p>
                  </div>
                  <button className="icon-btn sm" aria-label={`Cancelar mentoria ${b.subject}`} onClick={() => { cancelBooking(b.id); toast("Mentoria cancelada.", "info"); }}>
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card"><EmptyState title="Nenhuma mentoria agendada" /></div>
        )}
      </section>

      <section>
        <h2 className="section-title">Configurações</h2>
        <div className="card list-card">
          {SETTINGS_SECTIONS.map(({ key, label, icon: Icon }) => (
            <Link key={key} to={`/configuracoes/${key}`} className="list-row link-row">
              <Icon size={18} aria-hidden="true" /> <span className="grow">{label}</span> <ChevronRight size={16} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <div className="stack">
        <button className="btn btn-secondary-neutral" onClick={() => { resetData(); toast("Dados de demonstração restaurados.", "info"); }}>
          <RotateCcw size={16} /> Restaurar dados de demonstração
        </button>
        <button className="btn btn-danger-ghost" onClick={logout}><LogOut size={16} /> Sair da conta</button>
      </div>
    </div>
  );
}
