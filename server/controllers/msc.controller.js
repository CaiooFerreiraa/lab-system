import { asyncHandler } from "../middlewares/error-handler.js";

export default class MSCController {
  constructor(repository) {
    this.repository = repository;
  }

  register = asyncHandler(async (req, res) => {
    const id = await this.repository.register(req.body);
    res.status(201).json({ success: true, message: "MSC cadastrada com sucesso!", data: { id } });
  });

  edit = asyncHandler(async (req, res) => {
    await this.repository.edit(req.body);
    res.json({ success: true, message: "MSC atualizada com sucesso!" });
  });

  readAll = asyncHandler(async (_req, res) => {
    const mscs = await this.repository.readAll();
    res.json({ success: true, data: mscs });
  });

  getOne = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const msc = await this.repository.search(id);
    if (!msc) return res.status(404).json({ success: false, message: "MSC não encontrada." });
    res.json({ success: true, data: msc });
  });
}
