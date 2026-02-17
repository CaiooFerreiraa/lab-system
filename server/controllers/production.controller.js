import { asyncHandler } from "../middlewares/error-handler.js";

export default class ProductionController {
  constructor(repository) {
    this.repository = repository;
  }

  list = asyncHandler(async (req, res) => {
    const options = await this.repository.listAll();
    res.json({ success: true, data: options });
  });

  register = asyncHandler(async (req, res) => {
    const { categoria, valor } = req.body;
    const result = await this.repository.addOption({ categoria, valor });
    res.status(201).json({ success: true, data: result });
  });

  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await this.repository.removeOption(id);
    res.json({ success: true, message: "Opção removida com sucesso." });
  });

  getByCategory = asyncHandler(async (req, res) => {
    const { cat } = req.params;
    const options = await this.repository.getByCategory(cat);
    res.json({ success: true, data: options });
  });
}
