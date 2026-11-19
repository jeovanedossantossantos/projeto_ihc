import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { BackHeader } from "../components/ui";
import { addDays, toISODate } from "../utils";
import { EMAIL_RE } from "./Login";

/** Usa o nome antes do @ como identificação do convidado. */
export function nameFromEmail(email) {
  const base = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  return base.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function InviteInput({ invites, setInvites }) {
  const [invite, setInvite] = useState("");
  const [error, setError] = useState("");

  function add() {
    const email = invite.trim().toLowerCase();
    if (!email) return;
    if (!EMAIL_RE.test(email)) return setError("E-mail inválido.");
    if (invites.includes(email)) return setError("Este e-mail já foi adicionado.");
    setInvites([...invites, email]);
    setInvite("");
    setError("");
  }

  return (
    <div className="field">
      <span className="overline">Convidar integrantes</span>
      <div className="invite-row">
        <input
          type="email"
          placeholder="email@universidade.edu"
          value={invite}
          onChange={(e) => { setInvite(e.target.value); setError(""); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          aria-label="E-mail do integrante"
          aria-invalid={!!error}
        />
        <button type="button" className="btn btn-secondary" onClick={add}>Adicionar</button>
      </div>
      {error && <small className="field-error" role="alert">{error}</small>}
      {invites.length > 0 && (
        <div className="tags">
          {invites.map((m) => (
            <span key={m} className="tag tone-indigo tag-removable">
              {m}
              <button type="button" onClick={() => setInvites(invites.filter((x) => x !== m))} aria-label={`Remover ${m}`}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewGroup() {
  const { createGroup } = useData();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", subject: "", dueDate: addDays(14) });
  const [invites, setInvites] = useState([]);
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  function submit(e) {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = "Dê um nome ao grupo.";
    if (!form.subject.trim()) errs.subject = "Informe a matéria.";
    if (!form.dueDate || form.dueDate < toISODate(new Date())) errs.dueDate = "O prazo precisa ser hoje ou depois.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const group = createGroup({ name: form.name.trim(), subject: form.subject.trim(), dueDate: form.dueDate, invites: invites.map(nameFromEmail) });
    toast(invites.length ? `Grupo criado · ${invites.length} convite(s) enviado(s)` : "Grupo criado!");
    navigate(`/grupos/${group.id}`, { replace: true });
  }

  const field = (key, label, props) => (
    <label className="field">
      <span className="overline">{label}</span>
      <input value={form[key]} onChange={set(key)} aria-invalid={!!errors[key]} {...props} />
      {errors[key] && <small className="field-error" role="alert">{errors[key]}</small>}
    </label>
  );

  return (
    <form className="page narrow" onSubmit={submit} noValidate>
      <BackHeader title="Novo grupo" />
      {field("name", "Nome do trabalho", { placeholder: "Ex.: Trabalho de IHC" })}
      {field("subject", "Matéria", { placeholder: "Ex.: Prototipagem · 2º Semestre" })}
      {field("dueDate", "Prazo de entrega", { type: "date", min: toISODate(new Date()) })}
      <InviteInput invites={invites} setInvites={setInvites} />
      <button className="btn btn-pill btn-lg">Criar grupo</button>
    </form>
  );
}
