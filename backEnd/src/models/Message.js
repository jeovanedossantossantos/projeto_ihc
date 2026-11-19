import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: ObjectId, ref: 'Conversation', required: true },
    sender: { type: ObjectId, ref: 'User', required: true },
    text: { type: String, maxlength: 5000 },
    attachments: [{ _id: false, name: String, url: String, mime: String, size: Number }],
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

export const Message = mongoose.model('Message', messageSchema);
