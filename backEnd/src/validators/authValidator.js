const z = require("zod")

const registerSchema = z.object({
  name: z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres.").max(100),
  email: z.string().trim().email("Informe um e-mail válido.").max(254),
  password: z.string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .max(72, "A senha deve ter no máximo 72 caracteres.")
});

const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").max(254),
  password: z.string().min(1, "A senha é obrigatória.").max(72)
});

module.exports = {
  registerSchema,
  loginSchema
}