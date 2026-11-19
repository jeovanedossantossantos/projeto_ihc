import { Task } from '../models/Task.js';

// Progresso de cada grupo: total, concluídas, % e atrasadas. groupIds = ObjectIds.
export async function progressByGroup(groupIds) {
  const rows = await Task.aggregate([
    { $match: { group: { $in: groupIds } } },
    {
      $group: {
        _id: '$group',
        total: { $sum: 1 },
        done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$status', 'done'] },
                  { $eq: [{ $type: '$dueDate' }, 'date'] },
                  { $lt: ['$dueDate', '$$NOW'] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);
  const map = new Map(
    rows.map((r) => [
      r._id.toString(),
      { total: r.total, done: r.done, overdue: r.overdue, percent: Math.round((r.done / r.total) * 100) },
    ])
  );
  return (id) => map.get(id.toString()) ?? { total: 0, done: 0, overdue: 0, percent: 0 };
}
