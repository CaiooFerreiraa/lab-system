import { asyncHandler } from "../middlewares/error-handler.js";
import { isLabOrAdmin } from "../middlewares/auth.middleware.js";

export default class TestController {
  constructor(repository) {
    this.repository = repository;
  }

  register = asyncHandler(async (req, res) => {
    const body = req.body;

    // Fallback de Setor para Laudo
    if (body.shared && !body.shared.fk_cod_setor && req.user?.fk_cod_setor) {
      body.shared.fk_cod_setor = req.user.fk_cod_setor;
    }
    // Fallback de Matrícula para Laudo
    if (body.shared && !body.shared.fk_funcionario_matricula && req.user?.fk_funcionario_matricula) {
      body.shared.fk_funcionario_matricula = req.user.fk_funcionario_matricula;
    }

    // Fallback de Setor para Teste Individual
    if (!body.testes && !body.fk_cod_setor && req.user?.fk_cod_setor) {
      body.fk_cod_setor = req.user.fk_cod_setor;
    }
    // Fallback de Matrícula para Teste Individual
    if (!body.testes && !body.fk_funcionario_matricula && req.user?.fk_funcionario_matricula) {
      body.fk_funcionario_matricula = req.user.fk_funcionario_matricula;
    }

    // Se vier com array de testes, registra como laudo
    if (body.testes && Array.isArray(body.testes)) {
      const result = await this.repository.registerLaudo(body);
      return res.status(201).json({ success: true, message: "Laudo cadastrado com sucesso!", data: result });
    }
    // Individual (retrocompatibilidade)
    const result = await this.repository.register(body);
    res.status(201).json({ success: true, message: "Teste cadastrado!", data: result });
  });

  readAllLaudos = asyncHandler(async (req, res) => {
    const user = req.user;

    // Laboratório e Admin vêem todos os laudos (fk_cod_setor = null = sem filtro)
    // Todos os outros setores vêem APENAS os laudos do seu próprio setor
    const labAdmin = isLabOrAdmin(user);
    const fk_cod_setor = labAdmin ? null : (user?.fk_cod_setor || null);

    const data = await this.repository.readAllLaudos({ fk_cod_setor });
    res.json({ success: true, data });
  });

  getLaudo = asyncHandler(async (req, res) => {
    const data = await this.repository.getLaudo(req.params.id);

    if (!data) return res.status(404).json({ success: false, message: "Laudo não encontrado." });

    const user = req.user;

    // Bloqueia acesso a laudos de outros setores (exceto lab/admin)
    if (!isLabOrAdmin(user) && user?.fk_cod_setor && String(data.fk_cod_setor) !== String(user.fk_cod_setor)) {
      return res.status(403).json({ success: false, message: "Sem permissão para visualizar laudos de outros setores." });
    }

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
    // Apenas laboratório e admin podem alterar resultado de um teste
    if (!isLabOrAdmin(req.user)) {
      return res.status(403).json({ success: false, message: "Apenas o Laboratório pode alterar resultados de testes." });
    }

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

  editLaudo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    // Campos que apenas laboratório/admin podem alterar
    const restrictedFields = ['status_geral', 'fk_cod_setor'];
    const hasRestrictedField = restrictedFields.some(f => f in body);

    if (hasRestrictedField && !isLabOrAdmin(req.user)) {
      return res.status(403).json({ success: false, message: "Apenas o Laboratório pode alterar status e setor de laudos." });
    }

    await this.repository.editLaudo(id, body);
    res.json({ success: true, message: "Laudo atualizado com sucesso." });
  });
  deleteLaudo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const success = await this.repository.deleteLaudo(id);
    if (!success) return res.status(404).json({ success: false, message: "Laudo não encontrado." });
    res.json({ success: true, message: "Laudo excluído com sucesso." });
  });

  receiveLaudo = asyncHandler(async (req, res) => {
    if (!isLabOrAdmin(req.user)) {
      return res.status(403).json({ success: false, message: "Apenas o Laboratório pode confirmar o recebimento de laudos." });
    }

    const { id } = req.params;
    const matricula = req.user?.fk_funcionario_matricula;
    const result = await this.repository.markLaudoAsReceived(id, matricula);
    res.json({ success: true, message: "Laudo marcado como recebido. Prazo iniciado.", data: result });
  });

  getDelayedTests = asyncHandler(async (_req, res) => {
    const data = await this.repository.getDelayedTests();
    res.json({ success: true, data });
  });
}
