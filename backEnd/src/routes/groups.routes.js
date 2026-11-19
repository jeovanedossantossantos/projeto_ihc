import { Router } from 'express';
import { z } from 'zod';
import { Group } from '../models/Group.js';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { Conversation } from '../models/Conversation.js';
import { auth } from '../middleware/auth.js';
import { loadGroup, requireOwner } from '../middleware/group.js';
import { validate } from '../middleware/validate.js';
import { HttpError, asyncHandler, notFound, oid } from '../utils/http.js';
import { progressByGroup } from '../services/progress.js';
import { notify } from '../services/notify.js';
import tasksRouter from './tasks.routes.js';

const router = Router();
router.use(auth);

const emailsSchema = z.array(z.string().email()).max(10);

// Gera os convites (ignora quem já é membro / já foi convidado) e notifica quem já tem conta.
async function addInvites(group, emails, inviter) {
  const wanted = [...new Set(emails.map((e) => e.toLowerCase()))].filter(
    (e) => e !== inviter.email && !group.invites.some((i) => i.email === e && i.status !== 'declined')
  );
  const users = await User.find({ email: { $in: wanted } }).select('_id email');
  const byEmail = new Map(users.map((u) => [u.email, u._id]));
  const invalid = users.filter((u) => group.members.some((m) => m.user.equals(u._id))).map((u) => u.email);
  const fresh = wanted.filter((e) => !invalid.includes(e));

  fresh.forEach((email) => group.invites.push({ email, user: byEmail.get(email) }));
  await notify(fresh.map((e) => byEmail.get(e)), {
    type: 'group_invite',
    title: 'Convite para grupo',
    body: `${inviter.name} convidou você para "${group.name}"`,
    data: { groupId: group._id },
  });
  return fresh.length;
}

// FLUXO 2 · Criar grupo (Nome · matéria · prazo · integrantes) + "Adicionar: N convites enviados"
router.post(
  '/',
  validate(z.object({
    name: z.string().min(2),
    subject: z.string().optional(),
    deadline: z.coerce.date().optional(),
    memberEmails: emailsSchema.default([]),
  })),
  asyncHandler(async (req, res) => {
    const { memberEmails, ...data } = req.body;
    const group = new Group({ ...data, owner: req.user._id, members: [{ user: req.user._id, role: 'owner' }] });
    const convo = await Conversation.create({ type: 'group', group: group._id, participants: [req.user._id] });
    group.conversation = convo._id;
    const invitesSent = await addInvites(group, memberEmails, req.user);
    await group.save();
    res.status(201).json({ group, invitesSent });
  })
);

// Meus grupos (com % de progresso)
router.get(
  '/',
  validate(z.object({ status: z.enum(['active', 'delivered']).optional() }), 'query'),
  asyncHandler(async (req, res) => {
    const filter = { 'members.user': req.user._id, ...(req.query.status && { status: req.query.status }) };
    const groups = await Group.find(filter).sort('-updatedAt').populate('members.user', 'name avatarUrl');
    const progress = await progressByGroup(groups.map((g) => g._id));
    res.json(groups.map((g) => ({ ...g.toJSON(), progress: progress(g._id) })));
  })
);

// Convites pendentes do usuário logado
router.get(
  '/invites/me',
  asyncHandler(async (req, res) => {
    const groups = await Group.find({
      invites: { $elemMatch: { status: 'pending', $or: [{ user: req.user._id }, { email: req.user.email }] } },
    }).populate('owner', 'name avatarUrl');
    res.json(groups.map((g) => ({ groupId: g._id, name: g.name, subject: g.subject, deadline: g.deadline, owner: g.owner })));
  })
);

router.post(
  '/:id/invites/respond',
  validate(z.object({ accept: z.boolean() })),
  asyncHandler(async (req, res) => {
    const group = await Group.findById(req.params.id);
    if (!group) throw notFound('Grupo não encontrado');
    const invite = group.invites.find(
      (i) => i.status === 'pending' && (i.user?.equals(req.user._id) || i.email === req.user.email)
    );
    if (!invite) throw new HttpError(404, 'Nenhum convite pendente para você neste grupo');

    invite.user = req.user._id;
    invite.status = req.body.accept ? 'accepted' : 'declined';
    if (req.body.accept) {
      group.members.push({ user: req.user._id });
      await Conversation.updateOne({ _id: group.conversation }, { $addToSet: { participants: req.user._id } });
      await notify([group.owner], { type: 'invite_accepted', title: 'Convite aceito', body: `${req.user.name} entrou em "${group.name}"`, data: { groupId: group._id } });
    }
    await group.save();
    res.json({ status: invite.status, groupId: group._id });
  })
);

// Tela do grupo: dados + progresso
router.get(
  '/:id',
  loadGroup,
  asyncHandler(async (req, res) => {
    await req.group.populate([{ path: 'members.user', select: 'name email avatarUrl' }, { path: 'owner', select: 'name' }]);
    const progress = await progressByGroup([req.group._id]);
    res.json({ ...req.group.toJSON(), progress: progress(req.group._id) });
  })
);

router.patch(
  '/:id',
  loadGroup,
  requireOwner,
  validate(z.object({ name: z.string().min(2).optional(), subject: z.string().optional(), deadline: z.coerce.date().nullable().optional() })),
  asyncHandler(async (req, res) => {
    Object.assign(req.group, req.body);
    await req.group.save();
    res.json(req.group);
  })
);

router.post(
  '/:id/invites',
  loadGroup,
  requireOwner,
  validate(z.object({ emails: emailsSchema.min(1) })),
  asyncHandler(async (req, res) => {
    const invitesSent = await addInvites(req.group, req.body.emails, req.user);
    await req.group.save();
    res.status(201).json({ invitesSent });
  })
);

// Remover membro (dono) ou sair do grupo (próprio usuário)
router.delete(
  '/:id/members/:userId',
  loadGroup,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const self = userId === req.user._id.toString();
    if (!self && !req.isOwner) throw new HttpError(403, 'Apenas o criador remove outros membros');
    if (req.group.owner.equals(userId)) throw new HttpError(400, 'O criador não pode sair do grupo');
    req.group.members = req.group.members.filter((m) => !m.user.equals(userId));
    await req.group.save();
    await Conversation.updateOne({ _id: req.group.conversation }, { $pull: { participants: userId } });
    await Task.updateMany({ group: req.group._id, assignee: userId }, { $unset: { assignee: '' } });
    res.status(204).end();
  })
);

// "ENTREGA · marcar como feito"
router.post(
  '/:id/deliver',
  loadGroup,
  requireOwner,
  asyncHandler(async (req, res) => {
    if (req.group.status === 'delivered') throw new HttpError(400, 'Trabalho já entregue');
    req.group.status = 'delivered';
    req.group.deliveredAt = new Date();
    await req.group.save();
    await notify(req.group.members.map((m) => m.user).filter((u) => !u.equals(req.user._id)), {
      type: 'group_delivered', title: 'Trabalho entregue', body: `"${req.group.name}" foi marcado como entregue`, data: { groupId: req.group._id },
    });
    res.json(req.group);
  })
);

router.use('/:groupId/tasks', tasksRouter);

export default router;
