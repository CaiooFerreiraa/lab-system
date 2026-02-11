import { AppError } from "../error-handler.js";

const VALID_SHIFTS = ["Turno A", "Turno B", "Turno C"];

export function validateEmployee(req, _res, next) {
  const { registration, name, lastName, shift, phoneNumber } = req.body;

  if (!registration || typeof registration !== "string") {
    throw new AppError("A matrícula é obrigatória e deve ser uma string.");
  }

  if (!name || typeof name !== "string") {
    throw new AppError("O nome é obrigatório e deve ser uma string.");
  }

  if (!lastName || typeof lastName !== "string") {
    throw new AppError("O sobrenome é obrigatório e deve ser uma string.");
  }

  if (!shift || !VALID_SHIFTS.includes(shift)) {
    throw new AppError(`O turno deve ser um dos seguintes: ${VALID_SHIFTS.join(", ")}.`);
  }

  if (!phoneNumber || typeof phoneNumber !== "string") {
    throw new AppError("O telefone é obrigatório e deve ser uma string.");
  }

  next();
}
