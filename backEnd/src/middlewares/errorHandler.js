const notFound = (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`
  });
}

const errorHandler = (error, req, res, next) => {
  console.error(error);

  if (res.headersSent) return next(error);

  return res.status(500).json({
    success: false,
    message: "Erro interno do servidor."
  });
}


module.exports = {
  notFound, errorHandler
}