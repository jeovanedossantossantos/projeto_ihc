const express = require('express');
const rateLimit = require("express-rate-limit");
const PublicControlles = require("../controllers/public/index")
const router = express.Router();
const { register, login, indexUser } = require("../controllers/public/authController.js")
const { authenticate } = require("../middlewares/authMiddleware.js")
const { validate } = require("../middlewares/validate.js")
const { registerSchema, loginSchema } = require("../validators/authValidator.js")
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Muitas tentativas de login. Tente novamente em 15 minutos."
    }
});



router.get('/', PublicControlles.testeResponse)


router.post("/register", validate(registerSchema), register);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.get("/me", authenticate, indexUser);

module.exports = router