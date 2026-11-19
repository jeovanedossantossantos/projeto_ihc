import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true }, // usado nos "chips" (Cálculo, Física...)
});

export const Subject = mongoose.model('Subject', subjectSchema);
