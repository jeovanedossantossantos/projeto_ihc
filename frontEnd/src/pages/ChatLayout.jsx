import { useState } from "react";
import { Link, NavLink, Outlet, useMatch } from "react-router-dom";
import { MessageSquare, Plus, Search } from "lucide-react";
import { useData } from "../context/DataContext";
import { MENTORS } from "../data/mock";
import { Avatar, EmptyState } from "../components/ui";
import { firstName } from "../utils";

export function groupInitials(name) {
  const words = name.split(/\s+/);
  const acronym = words.find((w) => w.length >= 2 && w.length <= 4 && w === w.toUpperCase() && /^[A-Z]+$/.test(w));
  if (acronym) return acronym;
  const main = words.filter((w) => w.length > 2);
  return ((main[0]?.[0] || "") + (main[1]?.[0] || "")).toUpperCase() || "?";
}

function preview(msg) {
  if (!msg) return "Nenhuma mensagem ainda";
  if (msg.type === "task") return `📋 Tarefa: ${msg.text}`;
  if (msg.type === "info") return msg.text;
  const who = msg.author === "Você" ? "Você" : firstName(msg.author);
  return `${who}: ${msg.file ? "📎 " : ""}${msg.text}`;
}

export function ChatPlaceholder() {
  return (
    <div className="chat-placeholder">
      <EmptyState icon={MessageSquare} title="Selecione uma conversa" text="Converse com seu grupo ou com mentores." />
    </div>
  );
}

function ConversationLink({ c, unread }) {
  return (
    <NavLink to={c.to} className="conv">
      <Avatar name={c.name} label={c.label} size={44} tone={c.tone} online={c.online} />
      <div className="grow min0">
        <div className="conv-top">
          <strong className="ellipsis">{c.name}</strong>
          <small className={unread ? "text-primary strong" : "muted"}>{c.last?.time}</small>
        </div>
        <div className="conv-top">
          <p className={`small ellipsis ${unread ? "strong" : "muted"}`}>{c.subtitle || preview(c.last)}</p>
          {unread > 0 && <span className="unread" aria-label={`${unread} não lidas`}>{unread}</span>}
        </div>
      </div>
    </NavLink>
  );
}

export default function ChatLayout() {
  const room = useMatch("/chat/:kind/:id");
  const { groups, mentorChats, unread = {} } = useData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("todas");

  const q = query.trim().toLowerCase();
  const groupConvs = groups
    .filter((g) => g.status !== "arquivado")
    .map((g) => ({ key: `grupo:${g.id}`, name: g.name, label: groupInitials(g.name), tone: g.accent, last: g.messages.at(-1), to: `/chat/grupo/${g.id}` }))
    .filter((c) => c.name.toLowerCase().includes(q));
  const mentorConvs = Object.keys(mentorChats)
    .map((mid) => {
      const m = MENTORS.find((x) => x.id === mid);
      return { key: `mentor:${mid}`, name: m?.name || "Mentor", tone: m?.color, online: m?.online, last: mentorChats[mid].at(-1), to: `/chat/mentor/${mid}` };
    })
    .filter((c) => c.name.toLowerCase().includes(q));

  const showGroups = filter !== "mentores";
  const showMentors = filter !== "grupos";

  return (
    <div className={`chat-layout ${room ? "has-room" : ""}`}>
      <aside className="chat-list" aria-label="Conversas">
        <header className="page-header">
          <h1 className="page-title">Mensagens</h1>
          <Link to="/mentores" className="btn btn-secondary btn-sm"><Plus size={15} aria-hidden="true" /> Nova</Link>
        </header>
        <div className="search">
          <Search size={17} aria-hidden="true" />
          <input placeholder="Buscar conversa" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar conversa" />
        </div>
        <div className="chips" role="group" aria-label="Filtrar conversas">
          {[["todas", "Todas"], ["grupos", `Grupos · ${groupConvs.length}`], ["mentores", "Mentores"]].map(([k, l]) => (
            <button key={k} aria-pressed={filter === k} className={`chip ${filter === k ? "active" : ""}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
        <div className="conv-list">
          {showGroups && groupConvs.map((c) => <ConversationLink key={c.key} c={c} unread={unread[c.key]} />)}
          {showMentors && mentorConvs.length > 0 && (
            <>
              <p className="overline conv-section">Mentores</p>
              {mentorConvs.map((c) => <ConversationLink key={c.key} c={c} unread={unread[c.key]} />)}
            </>
          )}
          {!groupConvs.length && !mentorConvs.length && (
            <EmptyState title="Nenhuma conversa" text="Converse com mentores pelo perfil deles ou com seu grupo." />
          )}
        </div>
      </aside>
      <section className="chat-pane">
        <Outlet />
      </section>
    </div>
  );
}
