import { ZodError } from 'zod';
import { HttpError } from '../utils/http.js';

export const notFoundHandler = (req, res) =>
  res.status(404).json({ error: 'Rota não encontrada' });

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err instanceof ZodError)
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })),
    });
  if (err instanceof HttpError)
    return res.status(err.status).json({ error: err.message, details: err.details });
  if (err.name === 'CastError') return res.status(400).json({ error: 'ID inválido' });
  if (err.code === 11000) return res.status(409).json({ error: 'Registro duplicado' });
  if (err.name === 'MulterError') return res.status(400).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
};
