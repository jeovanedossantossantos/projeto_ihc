import { Router } from 'express';
import { z } from 'zod';
import { Subject } from '../models/Subject.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, slugify } from '../utils/http.js';

const router = Router();
router.use(auth);

// Chips de filtro (Cálculo, Física...)
router.get('/', asyncHandler(async (req, res) => res.json(await Subject.find().sort('name'))));

router.post(
  '/',
  validate(z.object({ name: z.string().min(2) })),
  asyncHandler(async (req, res) => {
    const subject = await Subject.create({ name: req.body.name, slug: slugify(req.body.name) });
    res.status(201).json(subject);
  })
);

export default router;
