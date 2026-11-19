import { Group } from '../models/Group.js';
import { HttpError, asyncHandler, notFound } from '../utils/http.js';

// Carrega o grupo (:id ou :groupId) e garante que o usuário é membro.
export const loadGroup = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.groupId ?? req.params.id);
  if (!group) throw notFound('Grupo não encontrado');
  if (!group.members.some((m) => m.user.equals(req.user._id)))
    throw new HttpError(403, 'Você não faz parte deste grupo');
  req.group = group;
  req.isOwner = group.owner.equals(req.user._id);
  next();
});

export const requireOwner = (req, res, next) =>
  req.isOwner ? next() : next(new HttpError(403, 'Apenas o criador do grupo'));
