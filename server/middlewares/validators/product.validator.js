import { AppError } from "../error-handler.js";

const VALID_TYPES = ["BN", "DN", "Base"];

export function validateProduct(req, _res, next) {
  const { referencia, tipo } = req.body;

  if (!referencia || typeof referencia !== "string") {
    throw new AppError("A referência é obrigatória e deve ser uma string.");
  }

  if (!tipo || !VALID_TYPES.includes(tipo)) {
    throw new AppError(`O tipo deve ser um dos seguintes: ${VALID_TYPES.join(", ")}.`);
  }

  next();
}
