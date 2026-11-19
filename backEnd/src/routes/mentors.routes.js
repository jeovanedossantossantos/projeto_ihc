import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Subject } from '../models/Subject.js';
import { Review } from '../models/Review.js';
import { Booking } from '../models/Booking.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { HttpError, asyncHandler, escapeRegex, notFound, oid } from '../utils/http.js';
import { getSlots } from '../services/slots.js';

const router = Router();
router.use(auth);

const PUBLIC_FIELDS = 'name avatarUrl course university mentorProfile';

// FLUXO 1 · "Como buscar?" -> ?search=calculo (barra de busca)  ou  ?subject=<slug|id> (chip)
// Lista ordenada por nota.
const listQuery = z.object({
  search: z.string().trim().optional(),
  subject: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

router.get(
  '/',
  validate(listQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { search, subject, page, limit } = req.query;
    const filter = { role: 'mentor' };
    const conditions = [];

    if (search) {
      const ids = await Subject.find({ name: new RegExp(escapeRegex(search), 'i') }).distinct('_id');
      conditions.push({ 'mentorProfile.subjects': { $in: ids } });
    }
    if (subject) {
      const s = await Subject.findOne(oid.safeParse(subject).success ? { _id: subject } : { slug: subject });
      conditions.push({ 'mentorProfile.subjects': { $in: s ? [s._id] : [] } });
    }
    if (conditions.length) filter.$and = conditions;

    const [items, total] = await Promise.all([
      User.find(filter)
        .select(PUBLIC_FIELDS)
        .populate('mentorProfile.subjects', 'name slug')
        .sort({ 'mentorProfile.ratingAvg': -1, 'mentorProfile.ratingCount': -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);
    res.json({ items, total, page, limit });
  })
);

// "Perfil mentor · Ver avaliações"
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const mentor = await User.findOne({ _id: req.params.id, role: 'mentor' })
      .select(PUBLIC_FIELDS)
      .populate('mentorProfile.subjects', 'name slug');
    if (!mentor) throw notFound('Mentor não encontrado');
    const reviews = await Review.find({ mentor: mentor._id })
      .sort('-createdAt')
      .limit(20)
      .populate('student', 'name avatarUrl');
    res.json({ mentor, reviews });
  })
);

// "Agendar · Data + horário": horários livres de um dia
router.get(
  '/:id/availability',
  validate(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD') }), 'query'),
  asyncHandler(async (req, res) => {
    const mentor = await User.findOne({ _id: req.params.id, role: 'mentor' });
    if (!mentor) throw notFound('Mentor não encontrado');
    res.json({ date: req.query.date, slots: await getSlots(mentor, req.query.date) });
  })
);

// Avaliar mentor (só depois de uma mentoria concluída)
router.post(
  '/:id/reviews',
  validate(
    z.object({ bookingId: oid, rating: z.number().int().min(1).max(5), comment: z.string().max(1000).optional() })
  ),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findOne({
      _id: req.body.bookingId,
      mentor: req.params.id,
      student: req.user._id,
      status: 'completed',
    });
    if (!booking) throw new HttpError(400, 'Só é possível avaliar uma mentoria concluída sua');

    const review = await Review.create({
      mentor: booking.mentor,
      student: req.user._id,
      booking: booking._id,
      rating: req.body.rating,
      comment: req.body.comment,
    });

    const [agg] = await Review.aggregate([
      { $match: { mentor: booking.mentor } },
      { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } },
    ]);
    await User.updateOne(
      { _id: booking.mentor },
      { $set: { 'mentorProfile.ratingAvg': Math.round(agg.avg * 100) / 100, 'mentorProfile.ratingCount': agg.n } }
    );
    res.status(201).json(review);
  })
);

export default router;
