import { Router } from 'express';
import { Booking } from '../models/Booking.js';
import { Group } from '../models/Group.js';
import { Notification } from '../models/Notification.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';
import { progressByGroup } from '../services/progress.js';

const router = Router();

// Aba "Início · Dashboard": próxima mentoria, trabalhos ativos, notificações
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const me = req.user._id;
    const [nextBooking, groups, unread, latest, pendingInvites] = await Promise.all([
      Booking.findOne({ $or: [{ student: me }, { mentor: me }], status: 'scheduled', startsAt: { $gte: new Date() } })
        .sort('startsAt').populate('mentor student', 'name avatarUrl').populate('subject', 'name'),
      Group.find({ 'members.user': me, status: 'active' }).sort('deadline').limit(5).select('name subject deadline'),
      Notification.countDocuments({ user: me, readAt: null }),
      Notification.find({ user: me }).sort('-createdAt').limit(5),
      Group.countDocuments({ invites: { $elemMatch: { status: 'pending', $or: [{ user: me }, { email: req.user.email }] } } }),
    ]);
    const progress = await progressByGroup(groups.map((g) => g._id));
    res.json({
      nextBooking,
      activeGroups: groups.map((g) => ({ ...g.toJSON(), progress: progress(g._id) })),
      notifications: { unread, latest },
      pendingInvites,
    });
  })
);

export default router;
