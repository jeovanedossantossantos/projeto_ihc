import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
import { Group } from '../models/Group.js';
import { Task } from '../models/Task.js';
import { auth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { HttpError, asyncHandler, notFound, oid } from '../utils/http.js';

const router = Router();
router.use(auth);

// Aba "Perfil · Dados pessoais"
router.patch(
  '/me',
  validate(z.object({
    name: z.string().min(2).optional(), course: z.string().optional(),
    university: z.string().optional(), avatarUrl: z.string().url().optional(),
  })),
  asyncHandler(async (req, res) => {
    Object.assign(req.user, req.body);
    await req.user.save();
    res.json(req.user);
  })
);

// "Privacidade"
router.patch(
  '/me/privacy',
  validate(z.object({ profileVisible: z.boolean().optional(), showHistory: z.boolean().optional() })),
  asyncHandler(async (req, res) => {
    Object.assign(req.user.privacy, req.body);
    await req.user.save();
    res.json(req.user.privacy);
  })
);

router.patch(
  '/me/password',
  validate(z.object({ currentPassword: z.string(), newPassword: z.string().min(6) })),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!(await user.comparePassword(req.body.currentPassword))) throw new HttpError(400, 'Senha atual incorreta');
    user.passwordHash = await User.hash(req.body.newPassword);
    await user.save();
    res.status(204).end();
  })
);

// Mentor edita bio, matérias e disponibilidade semanal
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm');
router.patch(
  '/me/mentor-profile',
  requireRole('mentor'),
  validate(z.object({
    bio: z.string().max(1000).optional(),
    subjects: z.array(oid).optional(),
    slotMinutes: z.number().int().min(15).max(240).optional(),
    availability: z.array(z.object({ weekday: z.number().int().min(0).max(6), start: hhmm, end: hhmm })).optional(),
  })),
  asyncHandler(async (req, res) => {
    Object.assign(req.user.mentorProfile, req.body);
    await req.user.save();
    res.json(req.user);
  })
);

// "Histórico"
router.get(
  '/me/history',
  asyncHandler(async (req, res) => {
    const [mentorings, groups] = await Promise.all([
      Booking.find({ $or: [{ student: req.user._id }, { mentor: req.user._id }], status: { $ne: 'scheduled' } })
        .sort('-startsAt').limit(50).populate('mentor student', 'name').populate('subject', 'name'),
      Group.find({ 'members.user': req.user._id, status: 'delivered' }).sort('-deliveredAt').select('name subject deliveredAt'),
    ]);
    res.json({ mentorings, groups });
  })
);

// "Progresso" (aba Perfil)
router.get(
  '/me/progress',
  asyncHandler(async (req, res) => {
    const [mentoringsDone, tasksDone, groupsDelivered, groupsActive] = await Promise.all([
      Booking.countDocuments({ student: req.user._id, status: 'completed' }),
      Task.countDocuments({ assignee: req.user._id, status: 'done' }),
      Group.countDocuments({ 'members.user': req.user._id, status: 'delivered' }),
      Group.countDocuments({ 'members.user': req.user._id, status: 'active' }),
    ]);
    res.json({ mentoringsDone, tasksDone, groupsDelivered, groupsActive });
  })
);

// Perfil público de outro usuário (respeita privacidade)
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('name avatarUrl course university role privacy');
    if (!user) throw notFound('Usuário não encontrado');
    if (!user.privacy.profileVisible && !user._id.equals(req.user._id)) throw new HttpError(403, 'Perfil privado');
    const { privacy, ...pub } = user.toJSON();
    res.json(pub);
  })
);

export default router;
