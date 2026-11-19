import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/opendyslexic/400.css";
import "@fontsource/opendyslexic/700.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { PrefsProvider } from "./context/PrefsContext";
import { PomodoroProvider } from "./context/PomodoroContext";
import { ToastProvider } from "./context/ToastContext";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <PrefsProvider>
        <AuthProvider>
          <DataProvider>
            <ToastProvider>
              <PomodoroProvider>
                <App />
              </PomodoroProvider>
            </ToastProvider>
          </DataProvider>
        </AuthProvider>
      </PrefsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
