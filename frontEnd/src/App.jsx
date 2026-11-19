import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppShell from "./components/AppShell";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Mentors from "./pages/Mentors";
import MentorProfile from "./pages/MentorProfile";
import ScheduleMentoring from "./pages/ScheduleMentoring";
import Groups from "./pages/Groups";
import NewGroup from "./pages/NewGroup";
import GroupDetail from "./pages/GroupDetail";
import ChatLayout, { ChatPlaceholder } from "./pages/ChatLayout";
import ChatRoom from "./pages/ChatRoom";
import CalendarPage from "./pages/CalendarPage";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

function RequireAuth() {
  const { user, checking } = useAuth();
  if (!user && checking) return <div className="splash">Carregando…</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function GuestOnly() {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="/mentores" element={<Mentors />} />
          <Route path="/mentores/:id" element={<MentorProfile />} />
          <Route path="/mentores/:id/agendar" element={<ScheduleMentoring />} />
          <Route path="/grupos" element={<Groups />} />
          <Route path="/grupos/novo" element={<NewGroup />} />
          <Route path="/grupos/:id" element={<GroupDetail />} />
          <Route path="/chat" element={<ChatLayout />}>
            <Route index element={<ChatPlaceholder />} />
            <Route path=":kind/:id" element={<ChatRoom />} />
          </Route>
          <Route path="/calendario" element={<CalendarPage />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/configuracoes" element={<Settings />} />
          <Route path="/configuracoes/:section" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
