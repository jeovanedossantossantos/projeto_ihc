import { Router } from 'express';
import auth from './auth.routes.js';
import users from './users.routes.js';
import home from './home.routes.js';
import subjects from './subjects.routes.js';
import mentors from './mentors.routes.js';
import bookings from './bookings.routes.js';
import groups from './groups.routes.js';
import chat from './chat.routes.js';
import uploads from './uploads.routes.js';
import notifications from './notifications.routes.js';

const api = Router();
api.use('/auth', auth);
api.use('/users', users);
api.use('/home', home);
api.use('/subjects', subjects);
api.use('/mentors', mentors);
api.use('/bookings', bookings);
api.use('/groups', groups); // inclui /groups/:groupId/tasks
api.use('/chat', chat);
api.use('/uploads', uploads);
api.use('/notifications', notifications);

export default api;
