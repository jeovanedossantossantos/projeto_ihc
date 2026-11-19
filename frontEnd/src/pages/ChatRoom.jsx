import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { CheckCheck, ClipboardList, Paperclip, Phone, Plus, SendHorizontal, Smile, Video } from "lucide-react";
import { useData } from "../context/DataContext";
import { usePrefs } from "../context/PrefsContext";
import { useToast } from "../context/ToastContext";
import { MENTORS } from "../data/mock";
import { Avatar, BackHeader } from "../components/ui";
import { firstName, formatDM } from "../utils";
import { groupInitials } from "./ChatLayout";

const GROUP_REPLIES = ["Boa! 👍", "Fechado, vou ver aqui.", "Perfeito, obrigado!", "Combinado.", "Já atualizei o kanban."];
const MENTOR_REPLIES = [
  "Ótimo, vou preparar alguns exercícios sobre isso.",
  "Pode mandar suas dúvidas que eu dou uma olhada antes.",
  "Combinado! Até a mentoria.",
];
const EMOJIS = ["👍", "👏", "💪", "🎉", "👀", "🙏"];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "pt-BR";
  window.speechSynthesis.speak(u);
}

export default function ChatRoom() {
  const { kind, id } = useParams();
  const toast = useToast();
  const { prefs } = usePrefs();
  const { groups, mentorChats, sendGroupMessage, sendMentorMessage, markRead } = useData();
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const endRef = useRef(null);
  const fileRef = useRef(null);
  const inputRef = useRef(null);
  const timers = useRef([]);

  const group = kind === "grupo" ? groups.find((g) => g.id === id) : null;
  const mentor = kind === "mentor" ? MENTORS.find((m) => m.id === id) : null;
  const messages = group ? group.messages : mentorChats[id] || [];
  const key = `${kind}:${id}`;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: prefs.reduceMotion ? "auto" : "smooth", block: "end" });
  }, [messages.length, typing, prefs.reduceMotion]);

  useEffect(() => {
    markRead(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, messages.length]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  if (!group && !mentor) return <Navigate to="/chat" replace />;

  const title = group ? group.name : mentor.name;
  const onlineCount = group ? (group.online?.length || 0) + 1 : 0;
  const send = (msg) => (group ? sendGroupMessage(group.id, msg) : sendMentorMessage(mentor.id, msg));
  const lastMineIndex = messages.map((m) => m.author).lastIndexOf("Você");

  // Simula a resposta de outro participante (não há backend de chat ainda).
  function simulateReply() {
    const others = group ? group.members.filter((m) => m !== "Você") : [mentor.name];
    if (!others.length) return;
    const author = pick(others);
    const reply = pick(group ? GROUP_REPLIES : MENTOR_REPLIES);
    timers.current.push(
      setTimeout(() => setTyping(author), 700),
      setTimeout(() => {
        setTyping(null);
        send({ author, text: reply });
        if (prefs.narration) speak(`${firstName(author)} disse: ${reply}`);
      }, 2400)
    );
  }

  function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    send({ author: "Você", text: text.trim() });
    setText("");
    simulateReply();
  }

  return (
    <div className="chat-room">
      <BackHeader
        to="/chat"
        right={
          <>
            <button className="icon-btn bordered" aria-label="Chamada de voz" onClick={() => toast("Chamadas de voz em breve.", "info")}><Phone size={17} /></button>
            <button className="icon-btn bordered" aria-label="Chamada de vídeo" onClick={() => toast("Chamadas de vídeo em breve.", "info")}><Video size={17} /></button>
          </>
        }
      >
        <div className="chat-head">
          <Avatar name={title} label={group ? groupInitials(group.name) : undefined} size={40} tone={group ? group.accent : mentor.color} />
          <div className="min0">
            <h1 className="chat-title ellipsis">{group ? <Link to={`/grupos/${group.id}`}>{title}</Link> : <Link to={`/mentores/${mentor.id}`}>{title}</Link>}</h1>
            <small className="text-success">
              {group ? (
                <><span aria-hidden="true">● </span>{onlineCount} online · <span className="muted">{group.members.length} integrantes</span></>
              ) : mentor.online ? (
                <><span aria-hidden="true">● </span>Online agora</>
              ) : (
                <span className="muted"><span aria-hidden="true">○ </span>Offline · visto há 2h</span>
              )}
            </small>
          </div>
        </div>
      </BackHeader>

      <div className="messages" role="log" aria-live="polite" aria-label={`Mensagens de ${title}`}>
        <p className="day-label">Hoje</p>
        {messages.length === 0 && <p className="hint center">Envie a primeira mensagem 👋</p>}
        {messages.map((m, i) => {
          if (m.type === "info") return <p key={m.id} className="day-label">{m.text}</p>;
          if (m.type === "task") {
            return (
              <div key={m.id} className="msg">
                <span className="msg-avatar system" aria-hidden="true"><ClipboardList size={16} /></span>
                <div className="msg-body">
                  <span className="msg-meta"><strong>MentorIA</strong> · {m.time}</span>
                  <div className="task-msg">
                    <span className="overline text-amber"><ClipboardList size={12} aria-hidden="true" /> Tarefa atribuída</span>
                    <strong>{m.text}</strong>
                    {m.due && (
                      <small>
                        Prazo: {formatDM(m.due)} · Para: {m.assignee === "Você" ? "você" : m.assignee}
                      </small>
                    )}
                    <Link to={`/grupos/${id}`} className="btn btn-primary btn-xs">Ver tarefa</Link>
                  </div>
                </div>
              </div>
            );
          }
          const mine = m.author === "Você";
          return (
            <div key={m.id} className={`msg ${mine ? "mine" : ""}`}>
              {!mine && <Avatar name={m.author} size={32} className="msg-avatar" />}
              <div className="msg-body">
                <span className="msg-meta">
                  <strong>{mine ? "Você" : m.author}</strong> · {m.time}
                </span>
                <div className="bubble">
                  {m.file && <Paperclip size={13} aria-label="Arquivo:" />} {m.text}
                </div>
                {mine && i === lastMineIndex && group && (
                  <span className="msg-read"><CheckCheck size={13} aria-hidden="true" /> lido por {group.members.length - 1}</span>
                )}
              </div>
            </div>
          );
        })}
        {typing && (
          <p className="typing" aria-live="polite">
            <span className="typing-dots" aria-hidden="true"><i /><i /><i /></span> {firstName(typing)} está digitando…
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form className="composer" onSubmit={submit}>
        <button type="button" className="icon-btn bordered" aria-label="Anexar arquivo" onClick={() => fileRef.current?.click()}>
          <Plus size={18} />
        </button>
        <button type="button" className="icon-btn bordered d-only-inline" aria-label="Anexar clipe" onClick={() => fileRef.current?.click()}>
          <Paperclip size={17} />
        </button>
        <div className="pop-wrap">
          <button type="button" className="icon-btn bordered" aria-label="Inserir emoji" aria-expanded={emojiOpen} onClick={() => setEmojiOpen((o) => !o)}>
            <Smile size={17} />
          </button>
          {emojiOpen && (
            <div className="popover emoji-pop up left">
              {EMOJIS.map((e) => (
                <button type="button" key={e} aria-label={`Emoji ${e}`} onClick={() => { setText((t) => t + e); setEmojiOpen(false); inputRef.current?.focus(); }}>
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) send({ author: "Você", text: f.name, file: true });
            e.target.value = "";
          }}
        />
        <input ref={inputRef} className="composer-input" placeholder="Digite uma mensagem…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Mensagem" />
        <button className="send-btn" aria-label="Enviar" disabled={!text.trim()}>
          <SendHorizontal size={18} />
        </button>
      </form>
    </div>
  );
}
