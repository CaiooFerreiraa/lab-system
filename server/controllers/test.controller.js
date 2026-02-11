import { asyncHandler, AppError } from "../middlewares/error-handler.js";

export default class TestController {
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Registra teste(s). Aceita:
   * - Objeto único (teste individual)
   * - { shared, testes: [...] } (cadastro em lote)
   */
  register = asyncHandler(async (req, res) => {
    const body = req.body;

    // Cadastro em lote
    if (body.testes && Array.isArray(body.testes)) {
      if (body.testes.length === 0) {
        throw new AppError("Envie pelo menos um teste.", 400);
      }
      const results = await this.repository.registerBatch(body);
      return res.status(201).json({
        success: true,
        message: `${results.total} teste(s) cadastrado(s).`,
        data: results,
      });
    }

    // Cadastro individual (retrocompatível)
    const result = await this.repository.register(body);
    res.status(201).json({
      success: true,
      message: "Teste cadastrado com sucesso.",
      data: result,
    });
  });

  search = asyncHandler(async (req, res) => {
    const { cod_teste } = req.query;
    const teste = await this.repository.search(cod_teste);
    res.json({ success: true, data: teste });
  });

  edit = asyncHandler(async (req, res) => {
    await this.repository.edit(req.body);
    res.json({ success: true, message: "Teste atualizado com sucesso." });
  });

  remove = asyncHandler(async (req, res) => {
    const { cod_teste } = req.query;
    await this.repository.delete(cod_teste);
    res.json({ success: true, message: "Teste deletado com sucesso." });
  });

  readAll = asyncHandler(async (_req, res) => {
    const testes = await this.repository.readAll();
    res.json({ success: true, data: testes });
  });

  report = asyncHandler(async (_req, res) => {
    const report = await this.repository.getReport();
    res.json({ success: true, data: report });
  });
}
