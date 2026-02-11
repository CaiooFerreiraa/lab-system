import { asyncHandler } from "../middlewares/error-handler.js";

export default class SectorController {
  constructor(repository) {
    this.repository = repository;
  }

  register = asyncHandler(async (req, res) => {
    await this.repository.register(req.body);
    res.status(201).json({ success: true, message: "Setor registrado com sucesso." });
  });

  search = asyncHandler(async (req, res) => {
    const setor = await this.repository.search(req.query.nome);
    res.json({ success: true, data: setor });
  });

  edit = asyncHandler(async (req, res) => {
    const { oldName, newName } = req.query;
    await this.repository.edit(oldName, newName);
    res.json({ success: true, message: "Setor atualizado com sucesso." });
  });

  remove = asyncHandler(async (req, res) => {
    const { nome } = req.query;
    await this.repository.delete(nome);
    res.json({ success: true, message: "Setor deletado com sucesso." });
  });

  readAll = asyncHandler(async (_req, res) => {
    const setores = await this.repository.readAll();
    res.json({ success: true, data: setores });
  });

  list = asyncHandler(async (req, res) => {
    const setor = await this.repository.searchMateriaisInSetor(req.query.uuid);
    res.json({ success: true, data: setor });
  });
}
