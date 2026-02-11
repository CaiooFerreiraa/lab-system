import MarkModel from "../models/mark.model.js";
import { asyncHandler } from "../middlewares/error-handler.js";

export default class MarkController {
  constructor(repository) {
    this.repository = repository;
  }

  register = asyncHandler(async (req, res) => {
    await this.repository.register(req.body);
    res.status(201).json({ success: true, message: "Marca cadastrada com sucesso." });
  });

  readAll = asyncHandler(async (_req, res) => {
    const marks = await this.repository.readAll();
    const formatted = MarkModel.formatMarks(marks);
    res.json({ success: true, data: formatted });
  });

  getOne = asyncHandler(async (req, res) => {
    const { name } = req.params;
    const mark = await this.repository.search(name);
    const formatted = MarkModel.formatMarks(mark);
    res.json({ success: true, data: formatted });
  });

  update = asyncHandler(async (req, res) => {
    const filtered = MarkModel.filterMethods(req.body);
    await this.repository.edit(filtered);
    res.json({ success: true, message: "Marca atualizada com sucesso." });
  });

  remove = asyncHandler(async (req, res) => {
    const { name } = req.params;
    await this.repository.delete(name);
    res.json({ success: true, message: "Marca deletada com sucesso." });
  });

  removeMethod = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await this.repository.deleteMethod(id);
    res.json({ success: true, message: "Método deletado com sucesso." });
  });

  listTypes = asyncHandler(async (_req, res) => {
    const types = await this.repository.listTypeTest();
    res.json({ success: true, data: types });
  });

  listTypeShoes = asyncHandler(async (_req, res) => {
    const types = await this.repository.listTypeShoes();
    res.json({ success: true, data: types });
  });
}
