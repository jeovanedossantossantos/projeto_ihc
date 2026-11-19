import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { auth } from '../middleware/auth.js';
import { HttpError } from '../utils/http.js';

export const UPLOAD_DIR = path.resolve('uploads');

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const router = Router();

// Protótipo: armazenamento local em /uploads. Em produção, trocar por S3/GCS.
router.post('/', auth, upload.single('file'), (req, res, next) => {
  if (!req.file) return next(new HttpError(400, 'Envie o arquivo no campo "file"'));
  res.status(201).json({
    name: req.file.originalname,
    url: `/uploads/${req.file.filename}`,
    mime: req.file.mimetype,
    size: req.file.size,
  });
});

export default router;
