import { asyncHandler } from "../middlewares/error-handler.js";

export default class TestController {
  constructor(repository) {
    this.repository = repository;
  }

  register = asyncHandler(async (req, res) => {
    const body = req.body;
    // Se vier com array de testes, registra como laudo
    if (body.testes && Array.isArray(body.testes)) {
      const result = await this.repository.registerLaudo(body);
      return res.status(201).json({ success: true, message: "Laudo cadastrado com sucesso!", data: result });
    }
    // Individual (retrocompatibilidade)
    const result = await this.repository.register(body);
    res.status(201).json({ success: true, message: "Teste cadastrado!", data: result });
  });

  readAllLaudos = asyncHandler(async (_req, res) => {
    const data = await this.repository.readAllLaudos();
    res.json({ success: true, data });
  });

  getLaudo = asyncHandler(async (req, res) => {
    const data = await this.repository.getLaudo(req.params.id);
    res.json({ success: true, data });
  });

  addTestToLaudo = asyncHandler(async (req, res) => {
    const { laudoId } = req.params;
    await this.repository.addTestToLaudo(laudoId, req.body);
    res.json({ success: true, message: "Novo teste adicionado ao laudo." });
  });

  search = asyncHandler(async (req, res) => {
    const { cod_teste } = req.query;
    const test = await this.repository.search(cod_teste);
    res.json({ success: true, data: test });
  });

  edit = asyncHandler(async (req, res) => {
    await this.repository.edit(req.body);
    res.json({ success: true, message: "Atualizado com sucesso." });
  });

  remove = asyncHandler(async (req, res) => {
    const { cod_teste } = req.query;
    await this.repository.delete(cod_teste);
    res.json({ success: true, message: "Excluído com sucesso." });
  });

  readAll = asyncHandler(async (_req, res) => {
    const data = await this.repository.readAll();
    res.json({ success: true, data });
  });

  report = asyncHandler(async (_req, res) => {
    const reportData = await this.repository.getReport();
    res.json({ success: true, data: reportData });
  });
}
