import { asyncHandler } from "../middlewares/error-handler.js";

export default class SectorController {
  constructor(repository) {
    this.repository = repository;
  }

  register = asyncHandler(async (req, res) => {
    const body = req.body;

    // 1. Cadastra Setor
    const sector = await this.repository.register(body);

    // 2. Se vierem SLAs granulares, cadastra-os
    if (body.slas && Array.isArray(body.slas) && sector) {
      await this.repository.updateGranularSLAs(sector.id, body.slas);
    }

    res.status(201).json({ success: true, message: "Setor registrado com sucesso." });
  });

  search = asyncHandler(async (req, res) => {
    const setor = await this.repository.search(req.query.nome);
    res.json({ success: true, data: setor });
  });

  edit = asyncHandler(async (req, res) => {
    const { oldName } = req.query;
    const body = req.body;

    // 1. Atualiza dados básicos do setor
    await this.repository.edit(oldName, body);

    // 2. Se vierem SLAs granulares, atualiza-os
    if (body.slas && Array.isArray(body.slas)) {
      const sector = await this.repository.search(body.newName || oldName);
      if (sector) {
        await this.repository.updateGranularSLAs(sector.id, body.slas);
      }
    }

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
