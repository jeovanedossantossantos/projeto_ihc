import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const reviewSchema = new mongoose.Schema(
  {
    mentor: { type: ObjectId, ref: 'User', required: true, index: true },
    student: { type: ObjectId, ref: 'User', required: true },
    booking: { type: ObjectId, ref: 'Booking', required: true, unique: true }, // 1 avaliação por mentoria
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

export const Review = mongoose.model('Review', reviewSchema);
