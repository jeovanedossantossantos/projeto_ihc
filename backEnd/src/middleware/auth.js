import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { HttpError, asyncHandler } from '../utils/http.js';

export const signToken = (user) =>
  jwt.sign({ sub: user._id.toString() }, env.jwtSecret, { expiresIn: env.jwtExpires });

export const auth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Token ausente');
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new HttpError(401, 'Token inválido ou expirado');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'Usuário não encontrado');
  req.user = user;
  next();
});

export const requireRole = (role) => (req, res, next) =>
  req.user.role === role ? next() : next(new HttpError(403, `Apenas para ${role}`));
