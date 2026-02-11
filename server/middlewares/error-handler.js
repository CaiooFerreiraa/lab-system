/**
 * Middleware de tratamento centralizado de erros.
 * Captura erros não tratados nos controllers e retorna resposta padronizada.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(err, _req, res, _next) {
  console.error("[Erro]:", err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Erro interno do servidor";

  res.status(statusCode).json({
    success: false,
    message,
  });
}

export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}
