import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Check, CheckCircle2, ChevronLeft, Clock, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePrefs } from "../context/PrefsContext";
import { daysUntil, initials } from "../utils";

/* ---------- Hooks ---------- */

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");

/** Fecha um popover ao clicar fora ou pressionar Esc. */
export function useDismiss(open, onClose) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && onClose();
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  return ref;
}

/* ---------- Avatares ---------- */

const AVATAR_TONES = ["indigo", "green", "amber", "sky", "red", "violet"];

function toneFor(name = "") {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

export function Avatar({ name, label, size = 40, tone, online, solid = false, className = "" }) {
  const { user } = useAuth();
  const display = name === "Você" ? user?.name || "Você" : name;
  return (
    <span
      className={`avatar tone-${tone || toneFor(display)} ${solid ? "solid" : ""} ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
      aria-hidden="true"
    >
      {label || initials(display)}
      {online !== undefined && <span className={`presence-dot ${online ? "on" : "off"}`} />}
    </span>
  );
}

export function AvatarStack({ names, max = 4, size = 26 }) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <span className="avatar-stack" aria-label={`${names.length} integrantes`}>
      {shown.map((n) => (
        <Avatar key={n} name={n} size={size} />
      ))}
      {extra > 0 && <span className="avatar-extra">+{extra}</span>}
    </span>
  );
}

/** Presença sempre com texto, não só cor (WCAG 1.4.1). */
export function Presence({ online, lastSeen = "visto há 2h" }) {
  return (
    <span className={`presence ${online ? "on" : "off"}`}>
      <span className="presence-symbol" aria-hidden="true">{online ? "●" : "○"}</span>
      {online ? "Online agora" : `Offline · ${lastSeen}`}
    </span>
  );
}

/* ---------- Marca ---------- */

export function Logo({ size = 72, inverted = false }) {
  return (
    <span className={`logo ${inverted ? "inverted" : ""}`} style={{ width: size, height: size }} aria-hidden="true">
      <Check size={size * 0.5} strokeWidth={3} />
    </span>
  );
}

/* ---------- Status ---------- */

export function ProgressBar({ value, tone = "indigo", label }) {
  return (
    <div
      className={`progress tone-${tone}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `${value}% concluído`}
    >
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  );
}

export function Tag({ children, tone = "indigo", size }) {
  return <span className={`tag tone-${tone} ${size === "lg" ? "tag-lg" : ""}`}>{children}</span>;
}

/** Tom (cor) que representa a urgência de um prazo. */
export function dueTone(iso, fallback = "indigo") {
  const n = daysUntil(iso);
  if (n <= 3) return "red";
  return fallback;
}

/** Selo de prazo: cor + ícone + texto, nunca só cor. Respeita "linguagem calma". */
export function DueBadge({ iso, done, tone }) {
  const { prefs } = usePrefs();
  const n = daysUntil(iso);
  if (done) {
    return (
      <span className="badge tone-green"><CheckCircle2 size={13} aria-hidden="true" /> Entregue</span>
    );
  }
  if (n < 0) {
    return (
      <span className="badge tone-red">
        <AlertTriangle size={13} aria-hidden="true" />
        {prefs.calmLanguage ? `Prazo passou há ${-n} dia${n === -1 ? "" : "s"}` : `Atrasado · ${-n} dia${n === -1 ? "" : "s"}`}
      </span>
    );
  }
  const label = n === 0 ? "hoje" : n === 1 ? "1 dia" : `${n} dias`;
  if (n <= 3 && !prefs.calmLanguage) {
    return (
      <span className="badge tone-red"><AlertTriangle size={13} aria-hidden="true" /> Urgente · {label}</span>
    );
  }
  return (
    <span className={`badge tone-${n <= 3 ? "amber" : tone || "green"}`}>
      <Clock size={13} aria-hidden="true" /> {n === 0 ? "Entrega hoje" : label}
    </span>
  );
}

export function Stars({ value, size = 13 }) {
  return (
    <span className="stars" aria-label={`Avaliação ${value.toFixed(1)} de 5`}>
      <span aria-hidden="true">★</span> {value.toFixed(1)}
    </span>
  );
}

/* ---------- Layout ---------- */

export function BackHeader({ title, to, right, children }) {
  const navigate = useNavigate();
  return (
    <header className="back-header">
      <button className="icon-btn" onClick={() => (to ? navigate(to) : navigate(-1))} aria-label="Voltar">
        <ChevronLeft size={22} />
      </button>
      {children || <h1 className="back-title">{title}</h1>}
      <div className="back-right">{right}</div>
    </header>
  );
}

export function Sheet({ open, onClose, title, children }) {
  const panel = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.activeElement;
    panel.current?.querySelector("input, select, button:not(.sheet-close)")?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div ref={panel} className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn sheet-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty">
      {Icon && (
        <span className="empty-icon" aria-hidden="true">
          <Icon size={24} />
        </span>
      )}
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function Switch({ label, description, checked, onChange }) {
  return (
    <label className="switch-row">
      <span className="switch-text">
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch" aria-hidden="true" />
    </label>
  );
}
