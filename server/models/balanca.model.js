import BaseModel from "./base.model.js";

export default class BalancaModel extends BaseModel {
  constructor(db) {
    super(db);
  }

  async register({ patrimonio, calibracao_externa, fk_cod_setor, status, diferenca_reprovacao }) {
    return await this.db`
      INSERT INTO lab_system.balanca (
        patrimonio, calibracao_externa, fk_cod_setor, status, diferenca_reprovacao
      ) VALUES (
        ${patrimonio}, ${calibracao_externa}, ${fk_cod_setor}, ${status}, ${diferenca_reprovacao || null}
      )
      RETURNING *
    `;
  }

  async readAll() {
    return await this.db`
      SELECT b.*, s.nome as setor_nome
      FROM lab_system.balanca b
      LEFT JOIN lab_system.setor s ON b.fk_cod_setor = s.id
      ORDER BY b.data_criacao DESC
    `;
  }

  async delete(id) {
    return await this.db`DELETE FROM lab_system.balanca WHERE id = ${id}`;
  }

  async edit({ id, patrimonio, calibracao_externa, fk_cod_setor, status, diferenca_reprovacao }) {
    return await this.db`
      UPDATE lab_system.balanca
      SET patrimonio = ${patrimonio}, 
          calibracao_externa = ${calibracao_externa}, 
          fk_cod_setor = ${fk_cod_setor}, 
          status = ${status}, 
          diferenca_reprovacao = ${diferenca_reprovacao || null}
      WHERE id = ${id}
    `;
  }

  async search(id) {
    const result = await this.db`SELECT * FROM lab_system.balanca WHERE id = ${id} LIMIT 1`;
    return result[0];
  }
}
