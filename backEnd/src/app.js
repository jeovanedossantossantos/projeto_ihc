import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import api from './routes/index.js';
import { UPLOAD_DIR } from './routes/uploads.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/uploads', express.static(UPLOAD_DIR)); // protótipo: arquivos públicos por URL
app.use('/api', api);

app.use(notFoundHandler);
app.use(errorHandler);
