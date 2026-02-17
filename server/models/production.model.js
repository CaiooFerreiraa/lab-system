import BaseModel from "./base.model.js";

export default class ProductionModel extends BaseModel {
  constructor(db) {
    super(db);
  }

  async listAll() {
    return await this.db`SELECT * FROM lab_system.opcoes_producao ORDER BY categoria, valor ASC`;
  }

  async addOption({ categoria, valor }) {
    return await this.db`
      INSERT INTO lab_system.opcoes_producao (categoria, valor)
      VALUES (${categoria}, ${valor})
      ON CONFLICT (categoria, valor) DO NOTHING
      RETURNING *
    `;
  }

  async removeOption(id) {
    return await this.db`DELETE FROM lab_system.opcoes_producao WHERE id = ${id}`;
  }

  async getByCategory(categoria) {
    return await this.db`SELECT valor FROM lab_system.opcoes_producao WHERE categoria = ${categoria} ORDER BY valor ASC`;
  }
}
