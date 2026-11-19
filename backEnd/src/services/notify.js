import { Notification } from '../models/Notification.js';
import { emitToUsers } from '../sockets/io.js';

// Cria notificações persistentes e envia em tempo real (se o usuário estiver conectado).
export async function notify(userIds, { type, title, body, data }) {
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  if (!ids.length) return;
  const docs = await Notification.insertMany(ids.map((user) => ({ user, type, title, body, data })));
  docs.forEach((n) => emitToUsers([n.user], 'notification:new', n));
}
