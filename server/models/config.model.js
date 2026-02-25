import BaseModel from "./base.model.js";

export default class ConfigModel extends BaseModel {
  constructor(db) {
    super(db);
  }

  async get(id) {
    const [row] = await this.db`SELECT * FROM lab_system.configuracao WHERE id = ${id}`;
    return row;
  }

  async set(id, valor) {
    const [row] = await this.db`
      INSERT INTO lab_system.configuracao (id, valor, data_atualizacao)
      VALUES (${id}, ${valor}, now())
      ON CONFLICT (id) DO UPDATE
      SET valor = EXCLUDED.valor, data_atualizacao = now()
      RETURNING *
    `;
    return row;
  }
}
