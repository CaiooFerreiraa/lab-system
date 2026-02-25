import { asyncHandler } from "../middlewares/error-handler.js";

export default class NotificacaoController {
  constructor(repository) {
    this.repository = repository;
  }

  registerEmail = asyncHandler(async (req, res) => {
    const data = await this.repository.registerEmail(req.body);
    res.status(201).json({ success: true, data });
  });

  readAllEmails = asyncHandler(async (_req, res) => {
    const data = await this.repository.readAllEmails();
    res.json({ success: true, data });
  });

  removeEmail = asyncHandler(async (req, res) => {
    await this.repository.deleteEmail(req.params.id);
    res.json({ success: true, message: "Email removido com sucesso." });
  });
}
