import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { AuthLayout, EMAIL_RE, Field, SocialLogin, fieldErrorsFrom } from "./Login";

// Espelha as regras do registerSchema do backend.
function validate(form) {
  const errs = {};
  if (form.name.trim().length < 2) errs.name = "O nome deve ter pelo menos 2 caracteres.";
  if (!EMAIL_RE.test(form.email.trim())) errs.email = "Informe um e-mail válido.";
  if (form.password.length < 8) errs.password = "A senha deve ter pelo menos 8 caracteres.";
  else if (form.password.length > 72) errs.password = "A senha deve ter no máximo 72 caracteres.";
  if (form.confirm !== form.password) errs.confirm = "As senhas não coincidem.";
  return errs;
}

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      toast("Conta criada com sucesso!");
      navigate("/", { replace: true });
    } catch (err) {
      setErrors(fieldErrorsFrom(err));
      setFormError(err.status === 409 ? "Não foi possível usar este e-mail. Tente outro." : err.message);
    } finally {
      setLoading(false);
    }
  }

  const input = (key, props) => (
    <input value={form[key]} onChange={set(key)} aria-invalid={!!errors[key]} {...props} />
  );

  return (
    <AuthLayout title="Criar conta" subtitle="Leva menos de um minuto.">
      <form onSubmit={handleSubmit} noValidate className="form">
        {formError && <div className="alert" role="alert">{formError}</div>}
        <Field label="Nome" error={errors.name}>{input("name", { autoComplete: "name", placeholder: "Seu nome completo" })}</Field>
        <Field label="E-mail" error={errors.email}>{input("email", { type: "email", autoComplete: "email", placeholder: "seu@email.com" })}</Field>
        <Field label="Senha" error={errors.password}>{input("password", { type: "password", autoComplete: "new-password", placeholder: "Mínimo de 8 caracteres" })}</Field>
        <Field label="Confirmar senha" error={errors.confirm}>{input("confirm", { type: "password", autoComplete: "new-password", placeholder: "Repita a senha" })}</Field>

        <button className="btn btn-primary btn-lg" disabled={loading}>{loading ? "Criando conta…" : "Cadastrar"}</button>

        <SocialLogin />

        <p className="auth-switch">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
