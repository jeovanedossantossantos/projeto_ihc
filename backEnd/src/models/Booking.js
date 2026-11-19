import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const bookingSchema = new mongoose.Schema(
  {
    student: { type: ObjectId, ref: 'User', required: true, index: true },
    mentor: { type: ObjectId, ref: 'User', required: true, index: true },
    subject: { type: ObjectId, ref: 'Subject', required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
    notes: String,
  },
  { timestamps: true }
);

// Impede dois agendamentos ativos no mesmo horário do mesmo mentor (proteção contra corrida).
bookingSchema.index(
  { mentor: 1, startsAt: 1 },
  { unique: true, partialFilterExpression: { status: 'scheduled' } }
);

export const Booking = mongoose.model('Booking', bookingSchema);
