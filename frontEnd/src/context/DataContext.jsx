import { createContext, useContext, useEffect, useState } from "react";
import { createInitialData } from "../data/mock";
import { nowTime, uid } from "../utils";

/*
 * Estado local do app (mentorias, grupos, tarefas e chats).
 * O backend ainda só expõe autenticação, então estes dados ficam
 * no localStorage até existirem rotas para eles.
 */
const DATA_KEY = "mentoria:data:v2";
const DataContext = createContext(null);

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(DATA_KEY));
    if (saved?.groups) return saved;
  } catch {
    /* ignora dados corrompidos */
  }
  return createInitialData();
}

export function DataProvider({ children }) {
  const [data, setData] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
    } catch {
      /* armazenamento indisponível */
    }
  }, [data]);

  const updateGroup = (groupId, fn) =>
    setData((d) => ({ ...d, groups: d.groups.map((g) => (g.id === groupId ? fn(g) : g)) }));

  const bumpUnread = (d, key) => ({ ...d.unread, [key]: (d.unread?.[key] || 0) + 1 });

  const actions = {
    addBooking(booking) {
      const b = { id: uid(), ...booking };
      setData((d) => ({ ...d, bookings: [...d.bookings, b] }));
      return b;
    },
    cancelBooking(id) {
      setData((d) => ({ ...d, bookings: d.bookings.filter((b) => b.id !== id) }));
    },
    toggleFavorite(mentorId) {
      setData((d) => {
        const favs = d.favorites || [];
        return { ...d, favorites: favs.includes(mentorId) ? favs.filter((f) => f !== mentorId) : [...favs, mentorId] };
      });
    },
    createGroup({ name, subject, dueDate, invites }) {
      const group = {
        id: uid(),
        name,
        subject,
        dueDate,
        status: "ativo",
        accent: ["indigo", "green", "amber", "sky"][Math.floor(Math.random() * 4)],
        members: ["Você", ...invites],
        online: [],
        files: [],
        tasks: [],
        messages: [
          { id: uid(), author: "MentorIA", text: `Grupo criado · ${invites.length} convite(s) enviado(s)`, time: nowTime(), type: "info" },
        ],
      };
      setData((d) => ({ ...d, groups: [group, ...d.groups] }));
      return group;
    },
    addMember(groupId, name) {
      updateGroup(groupId, (g) => ({
        ...g,
        members: [...g.members, name],
        messages: [...g.messages, { id: uid(), author: "MentorIA", text: `${name} foi convidado(a) para o grupo`, time: nowTime(), type: "info" }],
      }));
    },
    setGroupStatus(groupId, status) {
      updateGroup(groupId, (g) => ({ ...g, status }));
    },
    addTask(groupId, task) {
      const t = { id: uid(), status: "todo", ...task };
      updateGroup(groupId, (g) => ({
        ...g,
        tasks: [...g.tasks, t],
        messages: [
          ...g.messages,
          { id: uid(), author: "MentorIA", text: t.title, time: nowTime(), type: "task", taskId: t.id, due: t.due, assignee: t.assignee },
        ],
      }));
    },
    updateTask(groupId, taskId, changes) {
      updateGroup(groupId, (g) => ({
        ...g,
        tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, ...changes } : t)),
      }));
    },
    moveTask(groupId, taskId, status) {
      actions.updateTask(groupId, taskId, { status });
    },
    deleteTask(groupId, taskId) {
      updateGroup(groupId, (g) => ({ ...g, tasks: g.tasks.filter((t) => t.id !== taskId) }));
    },
    addFile(groupId, file) {
      updateGroup(groupId, (g) => ({ ...g, files: [...g.files, { id: uid(), by: "Você", ...file }] }));
    },
    sendGroupMessage(groupId, msg, { unread = false } = {}) {
      setData((d) => ({
        ...d,
        unread: unread ? bumpUnread(d, `grupo:${groupId}`) : d.unread,
        groups: d.groups.map((g) =>
          g.id === groupId ? { ...g, messages: [...g.messages, { id: uid(), time: nowTime(), type: "text", ...msg }] } : g
        ),
      }));
    },
    sendMentorMessage(mentorId, msg, { unread = false } = {}) {
      setData((d) => ({
        ...d,
        unread: unread ? bumpUnread(d, `mentor:${mentorId}`) : d.unread,
        mentorChats: {
          ...d.mentorChats,
          [mentorId]: [...(d.mentorChats[mentorId] || []), { id: uid(), time: nowTime(), type: "text", ...msg }],
        },
      }));
    },
    markRead(key) {
      setData((d) => (d.unread?.[key] ? { ...d, unread: { ...d.unread, [key]: 0 } } : d));
    },
    resetData() {
      setData(createInitialData());
    },
  };

  const unreadTotal = Object.values(data.unread || {}).reduce((a, b) => a + b, 0);

  return <DataContext.Provider value={{ ...data, unreadTotal, ...actions }}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
