const jwt = require("jsonwebtoken")

const authenticate = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Token de autenticação não informado."
    });
  }

  const token = authorization.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Token inválido ou expirado."
    });
  }
}

module.exports = {
  authenticate
}
