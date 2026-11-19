import { env } from '../config/env.js';
import { Booking } from '../models/Booking.js';

const toMin = (s) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

// "YYYY-MM-DD" no fuso configurado (TZ_OFFSET_MINUTES) para um instante UTC.
export const localDateStr = (date) =>
  new Date(date.getTime() + env.tzOffsetMinutes * 60000).toISOString().slice(0, 10);

// Horários livres do mentor em um dia: disponibilidade semanal - agendamentos ativos - passado.
export async function getSlots(mentor, dateStr) {
  const profile = mentor.mentorProfile;
  const base = Date.parse(`${dateStr}T00:00:00Z`);
  if (!profile || Number.isNaN(base)) return [];

  const weekday = new Date(base).getUTCDay();
  const dayStart = new Date(base - env.tzOffsetMinutes * 60000);
  const dayEnd = new Date(dayStart.getTime() + 86400000);
  const step = profile.slotMinutes || 60;

  const taken = await Booking.find({
    mentor: mentor._id,
    status: 'scheduled',
    startsAt: { $gte: dayStart, $lt: dayEnd },
  }).select('startsAt endsAt');

  const now = Date.now();
  const slots = [];
  for (const w of profile.availability.filter((a) => a.weekday === weekday)) {
    for (let m = toMin(w.start); m + step <= toMin(w.end); m += step) {
      const startsAt = new Date(dayStart.getTime() + m * 60000);
      const endsAt = new Date(startsAt.getTime() + step * 60000);
      if (startsAt.getTime() <= now) continue;
      if (taken.some((b) => b.startsAt < endsAt && b.endsAt > startsAt)) continue;
      slots.push({ startsAt, endsAt });
    }
  }
  return slots.sort((a, b) => a.startsAt - b.startsAt);
}
