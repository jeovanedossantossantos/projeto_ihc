import { Link, NavLink, Navigate, useParams } from "react-router-dom";
import { ChevronRight, Heart, LogOut, RotateCcw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePrefs } from "../context/PrefsContext";
import { useToast } from "../context/ToastContext";
import { Avatar, BackHeader, Switch, useIsDesktop } from "../components/ui";
import { SETTINGS_SECTIONS } from "./Profile";

const FONTS = [
  { key: "inter", label: "Inter", sub: "Padrão · recomendada" },
  { key: "atkinson", label: "Atkinson Hyperlegible", sub: "Melhor leitura · baixa visão" },
  { key: "opendyslexic", label: "OpenDyslexic", sub: "Para dislexia" },
];
const SPACINGS = [
  { key: "normal", label: "Normal" },
  { key: "confortavel", label: "Confortável" },
  { key: "amplo", label: "Amplo" },
];
const THEMES = [
  { key: "claro", label: "Claro" },
  { key: "escuro", label: "Escuro" },
  { key: "contraste", label: "Alto contraste" },
];

function sizeLabel(scale) {
  if (scale < 100) return "Pequeno";
  if (scale === 100) return "Padrão";
  if (scale <= 120) return "Grande";
  return "Muito grande";
}

function Accessibility() {
  const { prefs, setPref, resetPrefs } = usePrefs();
  const toast = useToast();

  return (
    <>
      <p className="muted">Ajuste o app ao seu modo de aprender. Tudo é salvo automaticamente.</p>
      <div className="settings-cols">
        <div className="stack-24">
          <h2 className="h4">Leitura e visão</h2>

          <div className="card settings-card">
            <label className="field">
              <span className="overline">Tamanho da fonte · {prefs.fontScale}%</span>
              <span className="range-row">
                <span aria-hidden="true" className="small">A</span>
                <input
                  type="range"
                  min={90}
                  max={150}
                  step={10}
                  value={prefs.fontScale}
                  onChange={(e) => setPref("fontScale", Number(e.target.value))}
                  aria-valuetext={`${sizeLabel(prefs.fontScale)}, ${prefs.fontScale}%`}
                />
                <span aria-hidden="true" className="big-a">A</span>
              </span>
              <strong className="small">{sizeLabel(prefs.fontScale)} ({prefs.fontScale}%)</strong>
            </label>
          </div>

          <fieldset className="card settings-card">
            <legend className="overline">Fonte</legend>
            <div className="radio-list">
              {FONTS.map((f) => (
                <label key={f.key} className={`radio-card font-${f.key} ${prefs.font === f.key ? "checked" : ""}`}>
                  <span>
                    <strong>{f.label}</strong>
                    <small>{f.sub}</small>
                  </span>
                  <input type="radio" name="font" value={f.key} checked={prefs.font === f.key} onChange={() => setPref("font", f.key)} />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="card settings-card">
            <legend className="overline">Espaçamento entre linhas</legend>
            <div className="segmented bordered">
              {SPACINGS.map((s) => (
                <label key={s.key} className={prefs.spacing === s.key ? "active" : ""}>
                  <input type="radio" name="spacing" className="sr-only" checked={prefs.spacing === s.key} onChange={() => setPref("spacing", s.key)} />
                  {s.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="card settings-card">
            <legend className="overline">Tema visual</legend>
            <div className="theme-grid">
              {THEMES.map((t) => (
                <label key={t.key} className={`theme-option ${prefs.theme === t.key ? "checked" : ""}`}>
                  <input type="radio" name="theme" className="sr-only" checked={prefs.theme === t.key} onChange={() => setPref("theme", t.key)} />
                  <span className={`theme-preview preview-${t.key}`} aria-hidden="true"><i /><i /><i /></span>
                  <span>{t.label}{prefs.theme === t.key ? " ✓" : ""}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="card settings-card">
            <span className="overline">Cursor</span>
            <Switch label="Cursor grande" description="Ponteiro do mouse ampliado" checked={prefs.bigCursor} onChange={(v) => setPref("bigCursor", v)} />
          </div>
        </div>

        <div className="stack-24">
          <h2 className="h4">Foco, movimento e som</h2>
          <div className="card settings-card switches">
            <Switch label="Modo foco" description="Esconde a barra lateral e as notificações durante o estudo" checked={prefs.focusMode} onChange={(v) => setPref("focusMode", v)} />
            <Switch label="Reduzir animações" description="Menos movimento, transições simples" checked={prefs.reduceMotion} onChange={(v) => setPref("reduceMotion", v)} />
            <Switch label="Pomodoro integrado" description="25 min de foco · 5 min de pausa" checked={prefs.pomodoro} onChange={(v) => setPref("pomodoro", v)} />
            <Switch label="Narração de textos" description="Lê em voz alta as mensagens recebidas no chat" checked={prefs.narration} onChange={(v) => setPref("narration", v)} />
            <Switch label="Linguagem calma" description="Sem alertas em caixa alta ou urgência exagerada" checked={prefs.calmLanguage} onChange={(v) => setPref("calmLanguage", v)} />
            <Switch label="Silenciar notificações" description="Esconde o sino e os avisos de prazo" checked={prefs.muteNotifications} onChange={(v) => setPref("muteNotifications", v)} />
            <Switch label="Modo anônimo em avaliações" description="Seu nome não aparece nos feedbacks de grupo" checked={prefs.anonymousReviews} onChange={(v) => setPref("anonymousReviews", v)} />
          </div>

          <div className="info-box" role="status">
            <Heart size={16} aria-hidden="true" />
            <div>
              <strong>Tudo pronto!</strong>
              <p className="small">Suas preferências são salvas automaticamente neste dispositivo.</p>
            </div>
          </div>
          <button className="btn btn-secondary-neutral" onClick={() => { resetPrefs(); toast("Preferências restauradas para o padrão.", "info"); }}>
            <RotateCcw size={16} /> Restaurar padrão
          </button>
        </div>
      </div>
    </>
  );
}

function Notifications() {
  const { prefs, setPref } = usePrefs();
  return (
    <div className="card settings-card switches narrow-block">
      <Switch label="Lembretes de mentoria" description="Aviso antes da mentoria começar" checked={prefs.notifyMentoring} onChange={(v) => setPref("notifyMentoring", v)} />
      <Switch label="Prazos de tarefas" description="Avisos de entregas próximas" checked={prefs.notifyTasks} onChange={(v) => setPref("notifyTasks", v)} />
      <Switch label="Mensagens do chat" description="Novas mensagens de grupos e mentores" checked={prefs.notifyChat} onChange={(v) => setPref("notifyChat", v)} />
      <Switch label="Silenciar tudo" description="Pausa todas as notificações" checked={prefs.muteNotifications} onChange={(v) => setPref("muteNotifications", v)} />
    </div>
  );
}

function Privacy() {
  const { prefs, setPref } = usePrefs();
  return (
    <div className="card settings-card switches narrow-block">
      <Switch label="Perfil visível para outros alunos" checked={prefs.publicProfile} onChange={(v) => setPref("publicProfile", v)} />
      <Switch label="Mostrar quando estou online" checked={prefs.showOnline} onChange={(v) => setPref("showOnline", v)} />
      <Switch label="Modo anônimo em avaliações" checked={prefs.anonymousReviews} onChange={(v) => setPref("anonymousReviews", v)} />
    </div>
  );
}

function Account() {
  const { user, logout } = useAuth();
  return (
    <div className="stack narrow-block">
      <div className="card account-card">
        <Avatar name={user?.name} size={56} />
        <div>
          <strong>{user?.name}</strong>
          <p className="muted small">{user?.email}</p>
          {user?.createdAt && <p className="muted small">Membro desde {new Date(user.createdAt).toLocaleDateString("pt-BR")}</p>}
        </div>
      </div>
      <button className="btn btn-danger-ghost" onClick={logout}><LogOut size={16} /> Sair da conta</button>
    </div>
  );
}

function Language() {
  return (
    <div className="card settings-card narrow-block">
      <label className="field">
        <span className="overline">Idioma do app</span>
        <select defaultValue="pt-BR" aria-describedby="lang-hint">
          <option value="pt-BR">Português (Brasil)</option>
        </select>
        <small id="lang-hint" className="muted">Outros idiomas estarão disponíveis em breve.</small>
      </label>
    </div>
  );
}

const CONTENT = { conta: Account, notificacoes: Notifications, privacidade: Privacy, acessibilidade: Accessibility, idioma: Language };

export default function Settings() {
  const { section } = useParams();
  const desktop = useIsDesktop();

  if (!section) {
    if (desktop) return <Navigate to="/configuracoes/acessibilidade" replace />;
    return (
      <div className="page narrow">
        <h1 className="page-title">Configurações</h1>
        <div className="card list-card">
          {SETTINGS_SECTIONS.map(({ key, label, icon: Icon }) => (
            <Link key={key} to={`/configuracoes/${key}`} className="list-row link-row">
              <Icon size={18} aria-hidden="true" /> <span className="grow">{label}</span> <ChevronRight size={16} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const Content = CONTENT[section];
  if (!Content) return <Navigate to="/configuracoes" replace />;
  const current = SETTINGS_SECTIONS.find((s) => s.key === section);

  return (
    <div className="settings-layout">
      <nav className="settings-nav d-only" aria-label="Configurações">
        <p className="overline">Configurações</p>
        {SETTINGS_SECTIONS.map(({ key, label, icon: Icon }) => (
          <NavLink key={key} to={`/configuracoes/${key}`} className="settings-link">
            <Icon size={17} aria-hidden="true" /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="page settings-page">
        <div className="m-only"><BackHeader title={current.label} to="/configuracoes" /></div>
        <div className="d-only">
          <nav className="breadcrumb" aria-label="Você está em">
            <Link to="/configuracoes">Configurações</Link> <span aria-hidden="true">›</span> <span aria-current="page">{current.label}</span>
          </nav>
          <h1 className="page-title">{current.label}</h1>
        </div>
        <Content />
      </div>
    </div>
  );
}

