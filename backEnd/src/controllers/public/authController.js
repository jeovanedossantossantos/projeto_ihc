
const User = require("../../models/User")
const { createToken, publicUser } = require("../../service/validationsUser")
class AuthController {

    async register(req, res, next) {
        try {
            const { name, email, password } = req.body;
            const normalizedEmail = email.toLowerCase();

            const existingUser = await User.findOne({ email: normalizedEmail });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "E-mail invalido!!!"
                });
            }

            const user = await User.create({
                name,
                email: normalizedEmail,
                password
            });

            const token = createToken(user._id);

            return res.status(201).json({
                success: true,
                message: "Usuário registrado com sucesso.",
                data: {
                    user: publicUser(user),
                    token,
                    tokenType: "Bearer"
                }
            });
        } catch (error) {
            // Também trata a corrida entre duas requisições com o mesmo e-mail.
            if (error.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: "E-mail invalido!!!"
                });
            }
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({
                email: email.toLowerCase()
            }).select("+password");

            // Mensagem genérica evita revelar se o e-mail está cadastrado.
            if (!user || !(await user.comparePassword(password))) {
                return res.status(401).json({
                    success: false,
                    message: "E-mail ou senha incorretos."
                });
            }

            const token = createToken(user._id);

            return res.status(200).json({
                success: true,
                message: "Login realizado com sucesso.",
                data: {
                    user: publicUser(user),
                    token,
                    tokenType: "Bearer"
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async indexUser(req, res, next) {
        try {
            const user = await User.findById(req.userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Usuário não encontrado."
                });
            }

            return res.status(200).json({
                success: true,
                data: { user: publicUser(user) }
            });
        } catch (error) {
            next(error);
        }
    }

}

module.exports = new AuthController()
