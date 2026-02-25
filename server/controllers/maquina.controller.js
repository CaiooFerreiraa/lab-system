import { asyncHandler } from "../middlewares/error-handler.js";

export default class MaquinaController {
  constructor(repository) {
    this.repository = repository;
  }

  register = asyncHandler(async (req, res) => {
    console.log("📝 Cadastrando máquina:", req.body);
    const data = await this.repository.register(req.body);
    res.status(201).json({ success: true, data });
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
    const data = await this.repository.edit({ id: req.params.id, ...req.body });
    res.json({ success: true, data });
  });

  remove = asyncHandler(async (req, res) => {
    await this.repository.delete(req.params.id);
    res.json({ success: true, message: "Máquina removida com sucesso." });
  });

  // Configurações de tempo
  registerConfig = asyncHandler(async (req, res) => {
    const data = await this.repository.registerConfig(req.body);
    res.status(201).json({ success: true, data });
  });

  readConfigs = asyncHandler(async (req, res) => {
    const data = await this.repository.readConfigs(req.params.maquinaId);
    res.json({ success: true, data });
  });

  readAllConfigs = asyncHandler(async (_req, res) => {
    const data = await this.repository.readAllConfigs();
    res.json({ success: true, data });
  });

  removeConfig = asyncHandler(async (req, res) => {
    await this.repository.deleteConfig(req.params.id);
    res.json({ success: true, message: "Configuração removida." });
  });

  getPerformance = asyncHandler(async (_req, res) => {
    const data = await this.repository.getMachinePerformance();
    res.json({ success: true, data });
  });
}
