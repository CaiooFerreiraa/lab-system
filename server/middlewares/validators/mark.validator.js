import { AppError } from "../error-handler.js";

export function validateMark(req, _res, next) {
  const { marca } = req.body;

  if (!marca || typeof marca !== "string") {
    throw new AppError("O nome da marca é obrigatório e deve ser uma string.");
  }

  next();
}
