import { Router } from 'express';
import { z } from 'zod';
import { Notification } from '../models/Notification.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, notFound } from '../utils/http.js';

const router = Router();
router.use(auth);

router.get(
  '/',
  validate(z.object({ unread: z.enum(['true', 'false']).optional(), limit: z.coerce.number().int().min(1).max(100).default(30) }), 'query'),
  asyncHandler(async (req, res) => {
    const filter = { user: req.user._id, ...(req.query.unread === 'true' && { readAt: null }) };
    const [items, unreadCount] = await Promise.all([
      Notification.find(filter).sort('-createdAt').limit(req.query.limit),
      Notification.countDocuments({ user: req.user._id, readAt: null }),
    ]);
    res.json({ items, unreadCount });
  })
);

router.patch(
  '/read-all',
  asyncHandler(async (req, res) => {
    await Notification.updateMany({ user: req.user._id, readAt: null }, { readAt: new Date() });
    res.status(204).end();
  })
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { readAt: new Date() }, { new: true });
    if (!n) throw notFound();
    res.json(n);
  })
);

export default router;
