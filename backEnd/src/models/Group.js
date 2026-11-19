import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    subject: String, // matéria (texto livre)
    deadline: Date,
    owner: { type: ObjectId, ref: 'User', required: true },
    members: [
      {
        _id: false,
        user: { type: ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['owner', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    invites: [
      {
        email: { type: String, lowercase: true, required: true },
        user: { type: ObjectId, ref: 'User' },
        status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
        invitedAt: { type: Date, default: Date.now },
      },
    ],
    status: { type: String, enum: ['active', 'delivered'], default: 'active' }, // "ENTREGA"
    deliveredAt: Date,
    conversation: { type: ObjectId, ref: 'Conversation' },
  },
  { timestamps: true }
);

groupSchema.index({ 'members.user': 1, status: 1 });
groupSchema.index({ 'invites.user': 1, 'invites.status': 1 });
groupSchema.index({ 'invites.email': 1 });

export const Group = mongoose.model('Group', groupSchema);
