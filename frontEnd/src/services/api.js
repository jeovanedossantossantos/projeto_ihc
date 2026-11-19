const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
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
    this.errors = errors;
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
  if (!response.ok || data.success === false) {
    throw new ApiError(data.message || "Erro inesperado.", response.status, data.errors || []);
  }
  return data;
}

export const authApi = {
  login: (email, password) => request("/login", { method: "POST", body: { email, password } }),
  register: (name, email, password) =>
    request("/register", { method: "POST", body: { name, email, password } }),
  me: () => request("/me", { auth: true }),
};
