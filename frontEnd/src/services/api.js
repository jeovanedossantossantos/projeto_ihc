// Base da API (o backend monta as rotas em /api).
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");
const TOKEN_KEY = "mentoria:token";

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors; // [{ field, message }]
  }
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = tokenStorage.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Não foi possível conectar ao servidor. Verifique se a API está rodando.", 0);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Formato de erro do backend: { error, details?: [{ campo, mensagem }] }
    const errors = Array.isArray(data.details)
      ? data.details.map((d) => ({ field: d.campo, message: d.mensagem }))
      : [];
    throw new ApiError(data.error || "Erro inesperado.", response.status, errors);
  }
  return data;
}

/** Normaliza o usuário da API ({ _id, name, email, ... }) para o formato usado no app. */
export function normalizeUser(u) {
  return u ? { ...u, id: u._id || u.id } : u;
}

export const authApi = {
  // Respostas: { token, user }
  login: async (email, password) => {
    const { token, user } = await request("/auth/login", { method: "POST", body: { email, password } });
    return { token, user: normalizeUser(user) };
  },
  register: async (name, email, password) => {
    const { token, user } = await request("/auth/register", { method: "POST", body: { name, email, password } });
    return { token, user: normalizeUser(user) };
  },
  // Resposta: o próprio usuário
  me: async () => normalizeUser(await request("/auth/me", { auth: true })),
};
