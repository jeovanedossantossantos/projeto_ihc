import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Heart, MessageSquare } from "lucide-react";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { MENTORS, SUBJECT_COLORS } from "../data/mock";
import { Avatar, Presence, Tag } from "../components/ui";

export default function MentorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { favorites = [], toggleFavorite } = useData();
  const mentor = MENTORS.find((m) => m.id === id);
  const [slot, setSlot] = useState(null);
  const [expanded, setExpanded] = useState(false);

  if (!mentor) return <Navigate to="/mentores" replace />;
  const fav = favorites.includes(mentor.id);

  return (
    <div className="mentor-profile">
      <section className="profile-cover">
        <div className="cover-bar">
          <button className="icon-btn on-dark" onClick={() => navigate(-1)} aria-label="Voltar">
            <ChevronLeft size={22} />
          </button>
          <button
            className="icon-btn on-dark"
            aria-pressed={fav}
            aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            onClick={() => {
              toggleFavorite(mentor.id);
              toast(fav ? "Removido dos favoritos." : "Adicionado aos favoritos.", "info");
            }}
          >
            <Heart size={20} fill={fav ? "currentColor" : "none"} />
          </button>
        </div>
        <Avatar name={mentor.name} size={92} tone={mentor.color} online={mentor.online} className="ringed" />
        <h1>{mentor.name}</h1>
        <p>{mentor.badge} · {mentor.institution}</p>
        <Presence online={mentor.online} />
      </section>

      <div className="page profile-body">
        <div className="stats raised">
          <div>
            <strong>{mentor.rating.toFixed(1)}</strong>
            <span><span aria-hidden="true">★</span> Avaliação</span>
          </div>
          <div>
            <strong>{mentor.sessions}</strong>
            <span>Mentorias</span>
          </div>
          <div>
            <strong>{mentor.years} {mentor.years === 1 ? "ano" : "anos"}</strong>
            <span>Experiência</span>
          </div>
        </div>

        <section>
          <h2 className="h4">Sobre</h2>
          <p className={`body-text ${expanded ? "" : "clamp-3"}`}>{mentor.bio}</p>
          <button className="link-sm" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
            {expanded ? "Ler menos" : "Ler mais"}
          </button>
        </section>

        <section>
          <h2 className="h4">Matérias</h2>
          <div className="tags">
            {mentor.subjects.map((s) => <Tag key={s} tone={SUBJECT_COLORS[s] || "indigo"} size="lg">{s}</Tag>)}
          </div>
        </section>

        <section>
          <h2 className="h4">Horários · hoje</h2>
          <div className="slots" role="group" aria-label="Horários disponíveis hoje">
            {mentor.slots.map((t) => (
              <button key={t} className={`slot ${slot === t ? "active" : ""}`} aria-pressed={slot === t} onClick={() => setSlot(slot === t ? null : t)}>
                {t}
              </button>
            ))}
          </div>
          <p className="hint">{mentor.price ? `R$ ${mentor.price}/h` : "Mentoria gratuita"} · {mentor.modes.map((m) => (m === "online" ? "Online" : "Presencial")).join(" ou ")}</p>
        </section>

        <section>
          <h2 className="h4">Avaliações</h2>
          <div className="stack">
            {mentor.reviews.map((r) => (
              <div key={r.author} className="review">
                <Avatar name={r.author} size={30} />
                <div className="grow">
                  <div className="mentor-top">
                    <strong className="small">{r.author}</strong>
                    <span className="rating" aria-label={`Nota ${r.rating}`}><span aria-hidden="true">★ {r.rating.toFixed(1)}</span></span>
                  </div>
                  <p className="muted small">{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="action-bar">
        <button className="btn btn-soft" onClick={() => navigate(`/chat/mentor/${mentor.id}`)}>
          <MessageSquare size={16} aria-hidden="true" /> Chat
        </button>
        <button className="btn btn-primary" onClick={() => navigate(`/mentores/${mentor.id}/agendar${slot ? `?hoje=${slot}` : ""}`)}>
          Agendar mentoria
        </button>
      </div>
    </div>
  );
}
