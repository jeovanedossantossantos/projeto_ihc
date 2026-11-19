import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

let io = null;

// Cada usuário entra na sala "user:<id>". Mensagens e notificações são emitidas para essas salas.
export function initIo(httpServer) {
  io = new Server(httpServer, { cors: { origin: env.clientOrigin } });
  io.use((socket, next) => {
    try {
      const { sub } = jwt.verify(socket.handshake.auth?.token, env.jwtSecret);
      socket.userId = sub;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });
  io.on('connection', (socket) => socket.join(`user:${socket.userId}`));
  return io;
}

export function emitToUsers(userIds, event, payload) {
  if (!io) return;
  io.to([...new Set(userIds.map(String))].map((id) => `user:${id}`)).emit(event, payload);
}
