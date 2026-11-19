import { createContext, useContext, useEffect, useState } from "react";

/*
 * Preferências de acessibilidade e notificações.
 * Aplicadas como atributos no <html>, para que o CSS reaja (tema, fonte, espaçamento…).
 */
const PREFS_KEY = "mentoria:prefs:v2";

export const DEFAULT_PREFS = {
  fontScale: 100, // %
  font: "inter", // inter | atkinson | opendyslexic
  spacing: "normal", // normal | confortavel | amplo
  theme: "claro", // claro | escuro | contraste
  bigCursor: false,
  focusMode: false,
  reduceMotion: false,
  pomodoro: true,
  narration: false,
  calmLanguage: false,
  muteNotifications: false,
  anonymousReviews: false,
  notifyMentoring: true,
  notifyTasks: true,
  notifyChat: true,
  publicProfile: false,
  showOnline: true,
};

const PrefsContext = createContext(null);

function load() {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY)) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function PrefsProvider({ children }) {
  const [prefs, setPrefs] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* armazenamento indisponível: preferências valem só nesta sessão */
    }
    const root = document.documentElement;
    root.style.fontSize = `${prefs.fontScale}%`;
    root.dataset.font = prefs.font;
    root.dataset.spacing = prefs.spacing;
    root.dataset.theme = prefs.theme;
    root.dataset.cursor = prefs.bigCursor ? "grande" : "padrao";
    root.dataset.motion = prefs.reduceMotion ? "reduzido" : "normal";
    root.dataset.focus = prefs.focusMode ? "on" : "off";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", prefs.theme === "claro" ? "#4F46E5" : "#0F172A");
  }, [prefs]);

  const setPref = (key, value) => setPrefs((p) => ({ ...p, [key]: value }));
  const resetPrefs = () => setPrefs(DEFAULT_PREFS);

  return <PrefsContext.Provider value={{ prefs, setPref, resetPrefs }}>{children}</PrefsContext.Provider>;
}

export const usePrefs = () => useContext(PrefsContext);
