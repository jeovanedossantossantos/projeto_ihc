import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Group } from '../models/Group.js';
import { auth, signToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { HttpError, asyncHandler } from '../utils/http.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
  role: z.enum(['student', 'mentor']).default('student'),
  course: z.string().optional(),
  university: z.string().optional(),
});

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { password, ...data } = req.body;
    if (await User.exists({ email: data.email.toLowerCase() }))
      throw new HttpError(409, 'E-mail já cadastrado');
    const user = await User.create({ ...data, passwordHash: await User.hash(password) });

    // Convites enviados por e-mail antes do cadastro passam a apontar para este usuário.
    await Group.updateMany(
      { 'invites.email': user.email },
      { $set: { 'invites.$[i].user': user._id } },
      { arrayFilters: [{ 'i.email': user.email, 'i.status': 'pending' }] }
    );
    res.status(201).json({ token: signToken(user), user });
  })
);

router.post(
  '/login',
  validate(z.object({ email: z.string().email(), password: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+passwordHash');
    if (!user || !(await user.comparePassword(req.body.password)))
      throw new HttpError(401, 'E-mail ou senha inválidos');
    res.json({ token: signToken(user), user });
  })
);

router.get('/me', auth, (req, res) => res.json(req.user));

export default router;
