// Popula o banco com dados de exemplo. ATENÇÃO: apaga as coleções existentes.
import mongoose from 'mongoose';
import { connectDb } from './config/db.js';
import { User } from './models/User.js';
import { Subject } from './models/Subject.js';
import { Group } from './models/Group.js';
import { Task } from './models/Task.js';
import { Conversation } from './models/Conversation.js';
import { Booking } from './models/Booking.js';
import { Review } from './models/Review.js';
import { Message } from './models/Message.js';
import { Notification } from './models/Notification.js';
import { slugify } from './utils/http.js';

await connectDb();
await Promise.all([User, Subject, Group, Task, Conversation, Booking, Review, Message, Notification].map((m) => m.deleteMany({})));

const subjects = await Subject.insertMany(
  ['Cálculo', 'Física', 'Álgebra Linear', 'Programação', 'Química', 'Estatística'].map((name) => ({ name, slug: slugify(name) }))
);
const S = Object.fromEntries(subjects.map((s) => [s.slug, s._id]));
const passwordHash = await User.hash('123456');

// Seg-Sex 14h-18h e 19h-21h
const availability = [1, 2, 3, 4, 5].flatMap((weekday) => [
  { weekday, start: '14:00', end: '18:00' },
  { weekday, start: '19:00', end: '21:00' },
]);

const mentors = await User.insertMany([
  { name: 'Ana Souza', email: 'ana@mentoria.dev', passwordHash, role: 'mentor', course: 'Engenharia', university: 'UFRB',
    mentorProfile: { bio: 'Monitora de Cálculo I e II.', subjects: [S['calculo'], S['algebra-linear']], availability, ratingAvg: 4.9, ratingCount: 32 } },
  { name: 'Bruno Lima', email: 'bruno@mentoria.dev', passwordHash, role: 'mentor', course: 'Física', university: 'UFRB',
    mentorProfile: { bio: 'Física geral e experimental.', subjects: [S['fisica'], S['calculo']], availability, ratingAvg: 4.6, ratingCount: 18 } },
  { name: 'Carla Mendes', email: 'carla@mentoria.dev', passwordHash, role: 'mentor', course: 'Ciência da Computação', university: 'UFRB',
    mentorProfile: { bio: 'Programação e estatística.', subjects: [S['programacao'], S['estatistica']], availability, ratingAvg: 4.8, ratingCount: 25 } },
]);

const [joao, maria, pedro, lia] = await User.insertMany(
  ['João', 'Maria', 'Pedro', 'Lia'].map((n) => ({ name: n, email: `${n.toLowerCase()}@mentoria.dev`, passwordHash, course: 'Engenharia', university: 'UFRB' }))
);

// Grupo com Kanban e chat
const group = new Group({
  name: 'Projeto de Física II', subject: 'Física', deadline: new Date(Date.now() + 14 * 86400000), owner: joao._id,
  members: [{ user: joao._id, role: 'owner' }, { user: maria._id }, { user: pedro._id }],
  invites: [{ email: lia.email, user: lia._id }],
});
const convo = await Conversation.create({ type: 'group', group: group._id, participants: [joao._id, maria._id, pedro._id] });
group.conversation = convo._id;
await group.save();
await Task.insertMany([
  { group: group._id, title: 'Pesquisar referências', status: 'done', assignee: maria._id, createdBy: joao._id, completedAt: new Date() },
  { group: group._id, title: 'Montar experimento', status: 'doing', assignee: pedro._id, dueDate: new Date(Date.now() + 5 * 86400000), createdBy: joao._id },
  { group: group._id, title: 'Escrever relatório', status: 'todo', assignee: joao._id, dueDate: new Date(Date.now() + 10 * 86400000), createdBy: joao._id },
]);

console.log('Seed ok. Login com qualquer e-mail abaixo, senha 123456:');
console.log('  alunos : joao@ maria@ pedro@ lia@ mentoria.dev');
console.log('  mentores: ana@ bruno@ carla@ mentoria.dev');
await mongoose.disconnect();
