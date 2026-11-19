import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const conversationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['direct', 'group'], required: true },
    participants: [{ type: ObjectId, ref: 'User', index: true }],
    group: { type: ObjectId, ref: 'Group' },
    directKey: String, // "idMenor:idMaior" -> garante 1 conversa 1:1 por par
    lastMessage: { text: String, sender: { type: ObjectId, ref: 'User' }, at: Date },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

conversationSchema.index({ directKey: 1 }, { unique: true, sparse: true });

export const Conversation = mongoose.model('Conversation', conversationSchema);
