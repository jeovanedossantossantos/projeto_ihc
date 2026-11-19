import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
import { auth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { HttpError, asyncHandler, notFound, oid } from '../utils/http.js';
import { getSlots, localDateStr } from '../services/slots.js';
import { notify } from '../services/notify.js';

const router = Router();
router.use(auth);

const POPULATE = [
  { path: 'mentor', select: 'name avatarUrl' },
  { path: 'student', select: 'name avatarUrl' },
  { path: 'subject', select: 'name slug' },
];

// FLUXO 1 · Agendar (fim: "Agendado ✓")
router.post(
  '/',
  validate(z.object({ mentorId: oid, subjectId: oid, startsAt: z.coerce.date(), notes: z.string().max(500).optional() })),
  asyncHandler(async (req, res) => {
    const { mentorId, subjectId, startsAt, notes } = req.body;
    if (mentorId === req.user._id.toString()) throw new HttpError(400, 'Você não pode agendar consigo mesmo');

    const mentor = await User.findOne({ _id: mentorId, role: 'mentor' });
    if (!mentor) throw notFound('Mentor não encontrado');
    if (!mentor.mentorProfile.subjects.some((s) => s.equals(subjectId)))
      throw new HttpError(400, 'Este mentor não atende essa matéria');

    // O horário precisa ser exatamente um dos slots livres do dia.
    const slots = await getSlots(mentor, localDateStr(startsAt));
    const slot = slots.find((s) => s.startsAt.getTime() === startsAt.getTime());
    if (!slot) throw new HttpError(409, 'Horário indisponível');

    let booking;
    try {
      booking = await Booking.create({
        student: req.user._id, mentor: mentor._id, subject: subjectId,
        startsAt: slot.startsAt, endsAt: slot.endsAt, notes,
      });
    } catch (e) {
      if (e.code === 11000) throw new HttpError(409, 'Horário acabou de ser reservado por outra pessoa');
      throw e;
    }

    await notify([mentor._id], {
      type: 'booking_created',
      title: 'Nova mentoria agendada',
      body: `${req.user.name} agendou para ${slot.startsAt.toISOString()}`,
      data: { bookingId: booking._id },
    });
    res.status(201).json(await booking.populate(POPULATE));
  })
);

// Minhas mentorias (como aluno ou como mentor). ?status=scheduled&upcoming=true
router.get(
  '/',
  validate(z.object({ status: z.enum(['scheduled', 'completed', 'cancelled']).optional(), upcoming: z.enum(['true', 'false']).optional() }), 'query'),
  asyncHandler(async (req, res) => {
    const filter = { $or: [{ student: req.user._id }, { mentor: req.user._id }] };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.upcoming === 'true') filter.startsAt = { $gte: new Date() };
    res.json(await Booking.find(filter).sort('startsAt').populate(POPULATE));
  })
);

const loadMine = async (req) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw notFound('Agendamento não encontrado');
  const me = req.user._id;
  if (!booking.student.equals(me) && !booking.mentor.equals(me)) throw new HttpError(403, 'Sem acesso');
  if (booking.status !== 'scheduled') throw new HttpError(400, `Agendamento já está ${booking.status}`);
  return booking;
};

router.patch(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const booking = await loadMine(req);
    booking.status = 'cancelled';
    await booking.save();
    const other = booking.student.equals(req.user._id) ? booking.mentor : booking.student;
    await notify([other], { type: 'booking_cancelled', title: 'Mentoria cancelada', body: `${req.user.name} cancelou a mentoria`, data: { bookingId: booking._id } });
    res.json(await booking.populate(POPULATE));
  })
);

router.patch(
  '/:id/complete',
  requireRole('mentor'),
  asyncHandler(async (req, res) => {
    const booking = await loadMine(req);
    if (!booking.mentor.equals(req.user._id)) throw new HttpError(403, 'Apenas o mentor conclui');
    booking.status = 'completed';
    await booking.save();
    await notify([booking.student], { type: 'review_request', title: 'Como foi a mentoria?', body: 'Avalie seu mentor', data: { bookingId: booking._id, mentorId: booking.mentor } });
    res.json(await booking.populate(POPULATE));
  })
);

export default router;
