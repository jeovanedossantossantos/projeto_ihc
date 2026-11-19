import { Router } from 'express';
import { z } from 'zod';
import { Task } from '../models/Task.js';
import { loadGroup } from '../middleware/group.js';
import { validate } from '../middleware/validate.js';
import { HttpError, asyncHandler, notFound, oid } from '../utils/http.js';
import { progressByGroup } from '../services/progress.js';
import { notify } from '../services/notify.js';

// Montado em /api/groups/:groupId/tasks  (Kanban: A fazer / Fazendo / Feito)
const router = Router({ mergeParams: true });
router.use(loadGroup);

const POPULATE = { path: 'assignee', select: 'name avatarUrl' };
const isMember = (group, userId) => group.members.some((m) => m.user.equals(userId));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const tasks = await Task.find({ group: req.group._id }).sort('order createdAt').populate(POPULATE);
    const board = { todo: [], doing: [], done: [] };
    tasks.forEach((t) => board[t.status].push(t));
    const progress = await progressByGroup([req.group._id]);
    res.json({ board, progress: progress(req.group._id) });
  })
);

const base = {
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  assignee: oid.nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
};

// "Criar tarefas · responsável + prazo"
router.post(
  '/',
  validate(z.object({ ...base, status: z.enum(['todo', 'doing', 'done']).default('todo') })),
  asyncHandler(async (req, res) => {
    if (req.group.status === 'delivered') throw new HttpError(400, 'Trabalho já entregue');
    if (req.body.assignee && !isMember(req.group, req.body.assignee))
      throw new HttpError(400, 'Responsável precisa ser membro do grupo');

    const task = await Task.create({
      ...req.body,
      group: req.group._id,
      createdBy: req.user._id,
      completedAt: req.body.status === 'done' ? new Date() : undefined,
    });
    if (task.assignee && !task.assignee.equals(req.user._id))
      await notify([task.assignee], { type: 'task_assigned', title: 'Nova tarefa para você', body: `${task.title} (${req.group.name})`, data: { groupId: req.group._id, taskId: task._id } });
    res.status(201).json(await task.populate(POPULATE));
  })
);

// Mover de coluna / editar / reatribuir
router.patch(
  '/:taskId',
  validate(z.object({
    title: base.title.optional(), description: base.description, assignee: base.assignee,
    dueDate: base.dueDate, status: z.enum(['todo', 'doing', 'done']).optional(), order: z.number().optional(),
  })),
  asyncHandler(async (req, res) => {
    const task = await Task.findOne({ _id: req.params.taskId, group: req.group._id });
    if (!task) throw notFound('Tarefa não encontrada');
    if (req.body.assignee && !isMember(req.group, req.body.assignee))
      throw new HttpError(400, 'Responsável precisa ser membro do grupo');

    const prevStatus = task.status;
    const prevAssignee = task.assignee?.toString();
    Object.assign(task, req.body);
    if (req.body.status && req.body.status !== prevStatus)
      task.completedAt = req.body.status === 'done' ? new Date() : undefined;
    await task.save();

    const others = req.group.members.map((m) => m.user).filter((u) => !u.equals(req.user._id));
    if (task.status === 'done' && prevStatus !== 'done')
      await notify(others, { type: 'task_done', title: 'Tarefa concluída', body: `${req.user.name} concluiu "${task.title}"`, data: { groupId: req.group._id, taskId: task._id } });
    if (task.assignee && task.assignee.toString() !== prevAssignee && !task.assignee.equals(req.user._id))
      await notify([task.assignee], { type: 'task_assigned', title: 'Tarefa atribuída a você', body: `${task.title} (${req.group.name})`, data: { groupId: req.group._id, taskId: task._id } });

    res.json(await task.populate(POPULATE));
  })
);

router.delete(
  '/:taskId',
  asyncHandler(async (req, res) => {
    const r = await Task.deleteOne({ _id: req.params.taskId, group: req.group._id });
    if (!r.deletedCount) throw notFound('Tarefa não encontrada');
    res.status(204).end();
  })
);

export default router;
