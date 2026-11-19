import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi, tokenStorage } from "../services/api";

const USER_KEY = "mentoria:user";
const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (tokenStorage.get() ? readStoredUser() : null));
  const [checking, setChecking] = useState(() => Boolean(tokenStorage.get()));

  const saveSession = useCallback(({ user: u, token }) => {
    tokenStorage.set(token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  // Valida o token salvo ao abrir o app.
  useEffect(() => {
    if (!tokenStorage.get()) return;
    authApi
      .me()
      .then(({ data }) => {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
      })
      .catch((err) => {
        // Sem conexão: mantém a sessão local. Token inválido: encerra.
        if (err.status === 401 || err.status === 404) logout();
      })
      .finally(() => setChecking(false));
  }, [logout]);

  const login = async (email, password) => {
    const { data } = await authApi.login(email, password);
    saveSession(data);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await authApi.register(name, email, password);
    saveSession(data);
    return data.user;
  };

  return (
    <AuthContext.Provider value={{ user, checking, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
