import { useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlarmClock, Archive, BarChart3, CalendarDays, Check, CheckCircle2, FileText, MessageSquare, MoreHorizontal,
  Plus, RotateCcw, Trash2, Upload, UserPlus, Users,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { TASK_TAGS } from "../data/mock";
import { Avatar, BackHeader, EmptyState, Presence, ProgressBar, Sheet, Tag, useDismiss, useIsDesktop } from "../components/ui";
import { daysUntil, formatDM, formatLongDate, groupProgress, toISODate } from "../utils";
import { InviteInput, nameFromEmail } from "./NewGroup";

const COLUMNS = [
  { key: "todo", label: "A fazer", tone: "sky" },
  { key: "doing", label: "Fazendo", tone: "amber" },
  { key: "review", label: "Revisão", tone: "violet" },
  { key: "done", label: "Feito", tone: "green" },
];

function TaskCard({ task, onOpen }) {
  const n = daysUntil(task.due);
  const done = task.status === "done";
  const soon = !done && n <= 1;
  return (
    <button
      className={`task ${done ? "done" : ""} ${task.status === "doing" ? "doing" : ""}`}
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
      onClick={() => onOpen(task)}
      aria-label={`${task.title}. ${task.tag}. Responsável: ${task.assignee}. Prazo ${formatDM(task.due)}${done ? ". Concluída" : ""}`}
    >
      {task.tag && <Tag tone={TASK_TAGS[task.tag] || "indigo"}>{task.tag}</Tag>}
      <span className="task-title">{task.title}</span>
      {task.description && !done && <span className="task-desc">{task.description}</span>}
      {task.status === "doing" && task.progress > 0 && (
        <span className="task-progress">
          <ProgressBar value={task.progress} /> <small>{task.progress}%</small>
        </span>
      )}
      <span className="task-foot">
        <Avatar name={task.assignee} size={22} />
        {done ? (
          <Check size={15} className="text-success" aria-hidden="true" />
        ) : (
          <span className={soon ? "text-danger strong" : ""}>
            {soon && <AlarmClock size={12} aria-hidden="true" />} {formatDM(task.due)}
            {task.comments ? <span className="muted"> · 💬 {task.comments}</span> : null}
          </span>
        )}
      </span>
    </button>
  );
}

function Kanban({ group, desktop, onOpen, onDrop, onAdd }) {
  const lanes = desktop ? [["todo"], ["doing"], ["review"], ["done"]] : [["todo"], ["doing"], ["review", "done"]];
  return (
    <div className={`kanban ${desktop ? "kanban-4" : ""}`}>
      {lanes.map((lane) => (
        <div key={lane.join()} className="kanban-lane">
          {lane.map((key) => {
            const col = COLUMNS.find((c) => c.key === key);
            const tasks = group.tasks.filter((t) => t.status === key);
            return (
              <section
                key={key}
                className="kanban-col"
                aria-label={`${col.label}: ${tasks.length} tarefas`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e.dataTransfer.getData("text/plain"), key)}
              >
                <h3>
                  <span className={`dot tone-${col.tone}`} aria-hidden="true" />
                  {col.label}
                  <span className={`count tone-${col.tone}`}>{tasks.length}</span>
                  {desktop && group.status === "ativo" && key !== "done" && (
                    <button className="icon-btn xs" aria-label={`Adicionar tarefa em ${col.label}`} onClick={() => onAdd(key)}>
                      <Plus size={15} />
                    </button>
                  )}
                </h3>
                {tasks.map((t) => <TaskCard key={t.id} task={t} onOpen={onOpen} />)}
                {!tasks.length && <p className="kanban-empty">Vazio</p>}
              </section>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function NewTaskForm({ group, status, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("Pesquisa");
  const [assignee, setAssignee] = useState(group.members[0]);
  const [due, setDue] = useState(group.dueDate);
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) return setError("Dê um título para a tarefa.");
    onCreate({ title: title.trim(), description: description.trim() || undefined, tag, assignee, due, status });
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <label className="field">
        <span className="overline">Tarefa</span>
        <input placeholder="Ex.: Revisar referências" value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} aria-invalid={!!error} />
        {error && <small className="field-error" role="alert">{error}</small>}
      </label>
      <label className="field">
        <span className="overline">Descrição (opcional)</span>
        <input placeholder="Ex.: 5 entrevistas · roteiro semi" value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <div className="form-2col">
        <label className="field">
          <span className="overline">Etiqueta</span>
          <select value={tag} onChange={(e) => setTag(e.target.value)}>
            {Object.keys(TASK_TAGS).map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="overline">Prazo</span>
          <input type="date" min={toISODate(new Date())} value={due} onChange={(e) => setDue(e.target.value)} />
        </label>
      </div>
      <label className="field">
        <span className="overline">Responsável</span>
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          {group.members.map((m) => <option key={m}>{m}</option>)}
        </select>
      </label>
      <button className="btn btn-primary btn-lg">Criar tarefa</button>
    </form>
  );
}

function StatusMenu({ group, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const pick = (status, msg) => {
    setOpen(false);
    onChange(status, msg);
  };
  return (
    <div className="pop-wrap" ref={ref}>
      <button className="icon-btn bordered" aria-label="Mais opções" aria-expanded={open} onClick={() => setOpen((m) => !m)}>
        <MoreHorizontal size={19} />
      </button>
      {open && (
        <div className="popover menu">
          {group.status === "ativo" ? (
            <>
              <button onClick={() => pick("concluido", "Trabalho marcado como entregue!")}><CheckCircle2 size={16} /> Marcar como entregue</button>
              <button onClick={() => pick("arquivado", "Grupo arquivado.")}><Archive size={16} /> Arquivar</button>
            </>
          ) : (
            <button onClick={() => pick("ativo", "Grupo reaberto.")}><RotateCcw size={16} /> Reabrir grupo</button>
          )}
        </div>
      )}
    </div>
  );
}

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const desktop = useIsDesktop();
  const [params, setParams] = useSearchParams();
  const { groups, addTask, moveTask, updateTask, deleteTask, addFile, addMember, setGroupStatus } = useData();
  const group = groups.find((g) => g.id === id);
  const [openTaskId, setOpenTaskId] = useState(null);
  const [creating, setCreating] = useState(null); // status da nova tarefa
  const [inviting, setInviting] = useState(false);
  const [invites, setInvites] = useState([]);

  if (!group) return <Navigate to="/grupos" replace />;

  const tab = params.get("aba") || "tarefas";
  const progress = groupProgress(group);
  const allDone = group.tasks.length > 0 && group.tasks.every((t) => t.status === "done");
  const task = group.tasks.find((t) => t.id === openTaskId);
  const active = group.status === "ativo";

  const TABS = [
    { key: "tarefas", label: "Tarefas" },
    { key: "arquivos", label: `Arquivos · ${group.files.length}` },
    { key: "chat", label: `Chat · ${group.messages.length}` },
    { key: "calendario", label: "Calendário" },
    { key: "integrantes", label: `Integrantes · ${group.members.length}` },
  ];

  function selectTab(key) {
    if (key === "chat") return navigate(`/chat/grupo/${group.id}`);
    setParams(key === "tarefas" ? {} : { aba: key }, { replace: true });
  }

  function changeStatus(status, message) {
    setGroupStatus(group.id, status);
    toast(message);
  }

  const meta = (
    <p className="group-meta">
      <span><AlarmClock size={14} aria-hidden="true" /> Entrega {formatDM(group.dueDate)}</span>
      <span><Users size={14} aria-hidden="true" /> {group.members.length} integrantes</span>
      <span><BarChart3 size={14} aria-hidden="true" /> {progress}% completo</span>
    </p>
  );

  return (
    <div className="page wide">
      {desktop ? (
        <header className="detail-header">
          <div>
            <nav className="breadcrumb" aria-label="Você está em">
              <Link to="/grupos">Grupos</Link> <span aria-hidden="true">›</span> <span aria-current="page">{group.name}</span>
            </nav>
            <h1 className="page-title">{group.name}</h1>
            {meta}
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary-neutral" onClick={() => setInviting(true)}><UserPlus size={16} /> Convidar</button>
            <Link to={`/chat/grupo/${group.id}`} className="btn btn-secondary-neutral"><MessageSquare size={16} /> Chat</Link>
            {active && <button className="btn btn-primary" onClick={() => setCreating("todo")}><Plus size={16} /> Nova tarefa</button>}
            <StatusMenu group={group} onChange={changeStatus} />
          </div>
        </header>
      ) : (
        <>
          <BackHeader title={group.name} to="/grupos" right={<StatusMenu group={group} onChange={changeStatus} />} />
          <div className="group-summary">
            {meta}
            <ProgressBar value={progress} tone={allDone ? "green" : "indigo"} />
          </div>
        </>
      )}

      {allDone && active && (
        <div className="deliver" role="status">
          <div>
            <strong><CheckCircle2 size={16} aria-hidden="true" /> Todas as tarefas concluídas</strong>
            <p className="small">Marque o trabalho como entregue.</p>
          </div>
          <button className="btn btn-amber btn-sm" onClick={() => changeStatus("concluido", "Trabalho marcado como entregue!")}>Entregar</button>
        </div>
      )}

      <div className="tabs" role="tablist" aria-label="Seções do grupo">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? "active" : ""} onClick={() => selectTab(t.key)}>
            {desktop ? t.label : t.label.split(" · ")[0].replace("Calendário", "Calend.").replace("Integrantes", "Equipe")}
          </button>
        ))}
      </div>

      {tab === "tarefas" && (
        <>
          <Kanban
            group={group}
            desktop={desktop}
            onOpen={(t) => setOpenTaskId(t.id)}
            onDrop={(taskId, status) => taskId && moveTask(group.id, taskId, status)}
            onAdd={setCreating}
          />
          <p className="hint center">Toque em uma tarefa para mover{desktop ? " · ou arraste entre as colunas" : ""}</p>
          {active && !desktop && (
            <button className="fab" aria-label="Nova tarefa" onClick={() => setCreating("todo")}>
              <Plus size={24} />
            </button>
          )}
        </>
      )}

      {tab === "arquivos" && (
        <div className="stack narrow-block">
          <label className="upload">
            <Upload size={18} aria-hidden="true" /> Enviar arquivo
            <input
              type="file"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const kb = f.size / 1024;
                addFile(group.id, { name: f.name, size: kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB` });
                toast("Arquivo adicionado.");
                e.target.value = "";
              }}
            />
          </label>
          {group.files.length ? (
            group.files.map((f) => (
              <div key={f.id} className="card file-row">
                <span className="file-icon" aria-hidden="true"><FileText size={18} /></span>
                <div className="grow min0">
                  <strong className="small ellipsis">{f.name}</strong>
                  <p className="muted small">{f.size} · enviado por {f.by}</p>
                </div>
              </div>
            ))
          ) : (
            <EmptyState icon={FileText} title="Nenhum arquivo ainda" text="Compartilhe materiais e entregas com o grupo." />
          )}
        </div>
      )}

      {tab === "calendario" && (
        <ol className="timeline narrow-block">
          {[...group.tasks.map((t) => ({ ...t, kind: "task" })), { id: "due", title: "Entrega final", due: group.dueDate, kind: "due" }]
            .sort((a, b) => a.due.localeCompare(b.due))
            .map((item) => (
              <li key={item.id} className={`timeline-item ${item.kind === "due" ? "is-due" : ""} ${item.status === "done" ? "is-done" : ""}`}>
                <span className="timeline-date">{formatLongDate(item.due)}</span>
                <div className="card timeline-card">
                  {item.kind === "due" ? <CalendarDays size={16} aria-hidden="true" /> : <Avatar name={item.assignee} size={22} />}
                  <span className="grow">{item.title}</span>
                  {item.status === "done" && <span className="badge tone-green"><Check size={12} aria-hidden="true" /> Feito</span>}
                </div>
              </li>
            ))}
        </ol>
      )}

      {tab === "integrantes" && (
        <div className="stack narrow-block">
          <div className="card list-card">
            {group.members.map((m) => (
              <div key={m} className="list-row">
                <Avatar name={m} size={36} online={m === "Você" || group.online?.includes(m)} />
                <div className="grow">
                  <strong className="small">{m}</strong>
                  <p className="small"><Presence online={m === "Você" || group.online?.includes(m)} /></p>
                </div>
                <span className="muted small">{group.tasks.filter((t) => t.assignee === m && t.status !== "done").length} tarefas</span>
              </div>
            ))}
          </div>
          <button className="btn btn-secondary" onClick={() => setInviting(true)}><UserPlus size={16} /> Convidar integrante</button>
        </div>
      )}

      <Sheet open={!!task} onClose={() => setOpenTaskId(null)} title={task?.title || ""}>
        {task && (
          <div className="form">
            <p className="muted small">
              {task.tag} · Responsável: <strong>{task.assignee === "Você" ? "você" : task.assignee}</strong> · Prazo: {formatDM(task.due)}
            </p>
            {task.description && <p className="body-text">{task.description}</p>}
            {task.status === "doing" && (
              <label className="field">
                <span className="overline">Progresso · {task.progress || 0}%</span>
                <input type="range" min={0} max={100} step={5} value={task.progress || 0} onChange={(e) => updateTask(group.id, task.id, { progress: Number(e.target.value) })} />
              </label>
            )}
            <span className="overline">Mover para</span>
            <div className="move-grid">
              {COLUMNS.map((c) => (
                <button key={c.key} className={`slot ${task.status === c.key ? "active" : ""}`} aria-pressed={task.status === c.key} onClick={() => { moveTask(group.id, task.id, c.key); setOpenTaskId(null); }}>
                  {c.label}
                </button>
              ))}
            </div>
            <button className="btn btn-danger-ghost" onClick={() => { deleteTask(group.id, task.id); setOpenTaskId(null); toast("Tarefa excluída."); }}>
              <Trash2 size={16} /> Excluir tarefa
            </button>
          </div>
        )}
      </Sheet>

      <Sheet open={!!creating} onClose={() => setCreating(null)} title="Nova tarefa">
        <NewTaskForm
          group={group}
          status={creating}
          onCreate={(t) => {
            addTask(group.id, t);
            setCreating(null);
            toast(`Tarefa atribuída a ${t.assignee === "Você" ? "você" : t.assignee}.`);
          }}
        />
      </Sheet>

      <Sheet open={inviting} onClose={() => setInviting(false)} title="Convidar integrantes">
        <div className="form">
          <InviteInput invites={invites} setInvites={setInvites} />
          <button
            className="btn btn-primary btn-lg"
            disabled={!invites.length}
            onClick={() => {
              invites.forEach((e) => addMember(group.id, nameFromEmail(e)));
              toast(`${invites.length} convite(s) enviado(s).`);
              setInvites([]);
              setInviting(false);
            }}
          >
            Enviar convites
          </button>
        </div>
      </Sheet>
    </div>
  );
}
