import { createContext, useContext, useEffect, useState } from "react";
import { useToast } from "./ToastContext";

const FOCUS_MIN = 25;
const BREAK_MIN = 5;
const PomodoroContext = createContext(null);

export function PomodoroProvider({ children }) {
  const toast = useToast();
  const [session, setSession] = useState(null); // { phase: "foco" | "pausa", endsAt }
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session]);

  useEffect(() => {
    if (!session || now < session.endsAt) return;
    if (session.phase === "foco") {
      toast(`Bloco de foco concluído! Pausa de ${BREAK_MIN} min.`);
      setSession({ phase: "pausa", endsAt: Date.now() + BREAK_MIN * 60000 });
    } else {
      toast("Pausa encerrada. Pronto para outro bloco?", "info");
      setSession(null);
    }
  }, [now, session, toast]);

  const start = () => {
    setNow(Date.now());
    setSession({ phase: "foco", endsAt: Date.now() + FOCUS_MIN * 60000 });
  };
  const stop = () => setSession(null);

  const remaining = session ? Math.max(0, Math.ceil((session.endsAt - now) / 1000)) : 0;
  const label = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;

  return (
    <PomodoroContext.Provider value={{ session, remaining, label, start, stop }}>{children}</PomodoroContext.Provider>
  );
}

export const usePomodoro = () => useContext(PomodoroContext);
