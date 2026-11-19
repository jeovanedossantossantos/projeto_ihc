import { Router } from 'express';
import { z } from 'zod';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { HttpError, asyncHandler, notFound, oid } from '../utils/http.js';
import { emitToUsers } from '../sockets/io.js';

const router = Router();
router.use(auth);

const format = (c, me) => {
  const others = c.participants.filter((p) => p._id.toString() !== me.toString());
  return {
    id: c._id,
    type: c.type,
    title: c.type === 'group' ? c.group?.name : others[0]?.name,
    groupId: c.group?._id,
    participants: c.participants,
    lastMessage: c.lastMessage,
    lastMessageAt: c.lastMessageAt,
  };
};

// "Lista de conversas"
router.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    const list = await Conversation.find({ participants: req.user._id })
      .sort('-lastMessageAt')
      .populate('participants', 'name avatarUrl')
      .populate('group', 'name');
    res.json(list.map((c) => format(c, req.user._id)));
  })
);

// Chat 1:1 (busca ou cria)
router.post(
  '/conversations',
  validate(z.object({ userId: oid })),
  asyncHandler(async (req, res) => {
    const other = req.body.userId;
    if (other === req.user._id.toString()) throw new HttpError(400, 'Não é possível conversar consigo mesmo');
    if (!(await User.exists({ _id: other }))) throw notFound('Usuário não encontrado');
    const directKey = [req.user._id.toString(), other].sort().join(':');
    let convo = await Conversation.findOne({ directKey });
    if (!convo) convo = await Conversation.create({ type: 'direct', participants: [req.user._id, other], directKey });
    await convo.populate('participants', 'name avatarUrl');
    res.status(201).json(format(convo, req.user._id));
  })
);

const mine = async (req) => {
  const convo = await Conversation.findOne({ _id: req.params.id, participants: req.user._id });
  if (!convo) throw notFound('Conversa não encontrada');
  return convo;
};

// Histórico (paginação por cursor: ?before=<ISO>&limit=30)
router.get(
  '/conversations/:id/messages',
  validate(z.object({ before: z.coerce.date().optional(), limit: z.coerce.number().int().min(1).max(100).default(30) }), 'query'),
  asyncHandler(async (req, res) => {
    const convo = await mine(req);
    const filter = { conversation: convo._id, ...(req.query.before && { createdAt: { $lt: req.query.before } }) };
    const msgs = await Message.find(filter).sort('-createdAt').limit(req.query.limit).populate('sender', 'name avatarUrl');
    res.json(msgs.reverse());
  })
);

// Mensagens + anexos (anexos vêm de POST /api/uploads)
router.post(
  '/conversations/:id/messages',
  validate(z.object({
    text: z.string().max(5000).optional(),
    attachments: z.array(z.object({
      name: z.string(), url: z.string().startsWith('/uploads/'), mime: z.string().optional(), size: z.number().optional(),
    })).max(5).default([]),
  }).refine((b) => b.text?.trim() || b.attachments.length, 'Envie texto ou anexo')),
  asyncHandler(async (req, res) => {
    const convo = await mine(req);
    const msg = await Message.create({ conversation: convo._id, sender: req.user._id, text: req.body.text, attachments: req.body.attachments });
    convo.lastMessage = { text: req.body.text || '📎 Anexo', sender: req.user._id, at: msg.createdAt };
    convo.lastMessageAt = msg.createdAt;
    await convo.save();
    await msg.populate('sender', 'name avatarUrl');
    emitToUsers(convo.participants, 'message:new', msg); // tempo real via Socket.IO
    res.status(201).json(msg);
  })
);

export default router;
