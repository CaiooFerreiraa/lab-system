import { asyncHandler } from "../middlewares/error-handler.js";

export default class ProductController {
  constructor(repository) {
    this.repository = repository;
  }

  register = asyncHandler(async (req, res) => {
    const data = req.body;
    // Fallback: Se não informado, pega o setor do usuário logado
    if (!data.setor && req.user?.fk_cod_setor) {
      data.setor = req.user.fk_cod_setor;
    }
    await this.repository.register(data);
    res.status(201).json({ success: true, message: "Material registrado com sucesso." });
  });

  search = asyncHandler(async (req, res) => {
    const { uuid } = req.query;
    const material = await this.repository.search(uuid);
    res.json({ success: true, data: material });
  });

  edit = asyncHandler(async (req, res) => {
    await this.repository.edit(req.query);
    res.json({ success: true, message: "Produto atualizado com sucesso." });
  });

  remove = asyncHandler(async (req, res) => {
    await this.repository.delete(req.query);
    res.json({ success: true, message: "Produto deletado com sucesso." });
  });

  readAll = asyncHandler(async (_req, res) => {
    const materiais = await this.repository.readAll();
    res.json({ success: true, data: materiais });
  });

  list = asyncHandler(async (_req, res) => {
    const materiais = await this.repository.list();
    res.json({ success: true, data: materiais });
  });
}
