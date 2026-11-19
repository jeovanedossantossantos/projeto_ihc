import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Logo } from "../components/ui";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function fieldErrorsFrom(err) {
  const out = {};
  for (const e of err.errors || []) out[e.field] = e.message;
  return out;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 23 23" aria-hidden="true">
      <path fill="#F35325" d="M1 1h10v10H1z" />
      <path fill="#81BC06" d="M12 1h10v10H12z" />
      <path fill="#05A6F0" d="M1 12h10v10H1z" />
      <path fill="#FFBA08" d="M12 12h10v10H12z" />
    </svg>
  );
}

export function SocialLogin() {
  const toast = useToast();
  const soon = () => toast("Login social estará disponível em breve.", "info");
  return (
    <>
      <div className="divider"><span>ou continue com</span></div>
      <div className="social-row">
        <button type="button" className="btn btn-secondary-neutral" onClick={soon}><GoogleIcon /> Google</button>
        <button type="button" className="btn btn-secondary-neutral" onClick={soon}><MicrosoftIcon /> Microsoft</button>
      </div>
    </>
  );
}

export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth">
      <section className="auth-hero">
        <Logo size={76} />
        <p className="auth-brand">MentorIA</p>
        <p className="auth-tagline">Estude, ensine, conclua juntos</p>
      </section>
      <main className="auth-card" id="conteudo">
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
      </main>
    </div>
  );
}

export function Field({ label, error, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {error && <small className="field-error" role="alert">{error}</small>}
    </label>
  );
}

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!EMAIL_RE.test(form.email.trim())) errs.email = "Informe um e-mail válido.";
    if (!form.password) errs.password = "A senha é obrigatória.";
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setErrors(fieldErrorsFrom(err));
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Entrar" subtitle="Bem-vindo(a) de volta!">
      <form onSubmit={handleSubmit} noValidate className="form">
        {formError && <div className="alert" role="alert">{formError}</div>}

        <Field label="E-mail" error={errors.email}>
          <input type="email" autoComplete="email" placeholder="seu@email.com" value={form.email} onChange={set("email")} aria-invalid={!!errors.email} />
        </Field>

        <Field label="Senha" error={errors.password}>
          <div className="input-wrap">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Sua senha"
              value={form.password}
              onChange={set("password")}
              aria-invalid={!!errors.password}
            />
            <button type="button" className="input-icon" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>

        <button type="button" className="link-btn right" onClick={() => toast("Recuperação de senha estará disponível em breve.", "info")}>
          Esqueci minha senha
        </button>

        <button className="btn btn-primary btn-lg" disabled={loading}>{loading ? "Entrando…" : "Entrar"}</button>

        <SocialLogin />

        <p className="auth-switch">
          Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
