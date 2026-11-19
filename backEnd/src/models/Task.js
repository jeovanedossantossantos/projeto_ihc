import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const taskSchema = new mongoose.Schema(
  {
    group: { type: ObjectId, ref: 'Group', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: String,
    status: { type: String, enum: ['todo', 'doing', 'done'], default: 'todo' }, // A fazer / Fazendo / Feito
    assignee: { type: ObjectId, ref: 'User' },
    dueDate: Date,
    order: { type: Number, default: 0 },
    completedAt: Date,
    createdBy: { type: ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Task = mongoose.model('Task', taskSchema);
