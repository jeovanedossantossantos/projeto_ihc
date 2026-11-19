import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const availabilitySchema = new mongoose.Schema(
  {
    weekday: { type: Number, min: 0, max: 6, required: true }, // 0 = domingo
    start: { type: String, required: true }, // "HH:mm"
    end: { type: String, required: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'mentor'], default: 'student', index: true },
    course: String,
    university: String,
    avatarUrl: String,
    privacy: {
      profileVisible: { type: Boolean, default: true },
      showHistory: { type: Boolean, default: false },
    },
    // Só preenchido para role = 'mentor'
    mentorProfile: {
      bio: String,
      subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
      availability: [availabilitySchema],
      slotMinutes: { type: Number, default: 60 },
      ratingAvg: { type: Number, default: 0 },
      ratingCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

userSchema.index({ 'mentorProfile.subjects': 1, 'mentorProfile.ratingAvg': -1 });

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};
userSchema.statics.hash = (plain) => bcrypt.hash(plain, 10);
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
