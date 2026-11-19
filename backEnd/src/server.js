import http from 'node:http';
import { app } from './app.js';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { initIo } from './sockets/io.js';

await connectDb();
const server = http.createServer(app);
initIo(server);
server.listen(env.port, () => console.log(`MentorIA API em http://localhost:${env.port}`));
