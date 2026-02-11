import { asyncHandler, AppError } from "../middlewares/error-handler.js";

export default class ModelController {
  constructor(repository) {
    this.repository = repository;
  }

  register = asyncHandler(async (req, res) => {
    const { nome, tipo, marca, especificacoes } = req.body;

    if (!Array.isArray(especificacoes) || especificacoes.length === 0) {
      throw new AppError("É necessário enviar pelo menos uma especificação.");
    }

    await this.repository.register({ nome, tipo, marca, especificacoes });
    res.status(201).json({ success: true, message: "Modelo registrado com sucesso." });
  });

  search = asyncHandler(async (req, res) => {
    const id = req.params.uuid;
    const modelo = await this.repository.search(id);
    res.json({ success: true, data: modelo });
  });

  edit = asyncHandler(async (req, res) => {
    await this.repository.edit(req.body);
    res.json({ success: true, message: "Modelo atualizado com sucesso." });
  });

  remove = asyncHandler(async (req, res) => {
    await this.repository.delete(req.query);
    res.json({ success: true, message: "Modelo deletado com sucesso." });
  });

  readAll = asyncHandler(async (_req, res) => {
    const modelos = await this.repository.readAll();
    res.json({ success: true, data: modelos });
  });
}
