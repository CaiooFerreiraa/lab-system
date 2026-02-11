import { asyncHandler } from "../middlewares/error-handler.js";

export default class BalancaController {
  constructor(repository) {
    this.repository = repository;
  }

  register = asyncHandler(async (req, res) => {
    await this.repository.register(req.body);
    res.status(201).json({ success: true, message: "Balança cadastrada com sucesso!" });
  });

  readAll = asyncHandler(async (_req, res) => {
    const data = await this.repository.readAll();
    res.json({ success: true, data });
  });

  search = asyncHandler(async (req, res) => {
    const data = await this.repository.search(req.params.id);
    res.json({ success: true, data });
  });

  edit = asyncHandler(async (req, res) => {
    await this.repository.edit(req.body);
    res.json({ success: true, message: "Balança atualizada com sucesso!" });
  });

  remove = asyncHandler(async (req, res) => {
    await this.repository.delete(req.params.id);
    res.json({ success: true, message: "Balança excluída com sucesso!" });
  });
}
