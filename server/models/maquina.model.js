import BaseModel from "./base.model.js";

export default class MaquinaModel extends BaseModel {
  constructor(db) {
    super(db);
  }

  async register({ nome, descricao, fk_cod_setor, status }) {
    const [row] = await this.db`
      INSERT INTO lab_system.maquina (nome, descricao, fk_cod_setor, status)
      VALUES (${nome}, ${descricao || null}, ${fk_cod_setor || null}, ${status || 'Ativo'})
      RETURNING *
    `;
    return row;
  }

  async readAll() {
    return await this.db`
      SELECT m.*, s.nome as setor_nome
      FROM lab_system.maquina m
      LEFT JOIN lab_system.setor s ON m.fk_cod_setor = s.id
      ORDER BY m.nome ASC
    `;
  }

  async search(id) {
    const [row] = await this.db`SELECT * FROM lab_system.maquina WHERE id = ${id} LIMIT 1`;
    return row;
  }

  async edit({ id, nome, descricao, fk_cod_setor, status }) {
    const [row] = await this.db`
      UPDATE lab_system.maquina
      SET nome = ${nome},
          descricao = ${descricao || null},
          fk_cod_setor = ${fk_cod_setor || null},
          status = ${status}
      WHERE id = ${id}
      RETURNING *
    `;
    return row;
  }

  async delete(id) {
    await this.db`DELETE FROM lab_system.maquina WHERE id = ${id}`;
  }

  // Configuração de Tempos
  async registerConfig({ fk_maquina_id, fk_tipo_cod_tipo, tempo_estimado_segundos }) {
    const [row] = await this.db`
      INSERT INTO lab_system.maquina_teste_config (fk_maquina_id, fk_tipo_cod_tipo, tempo_estimado_segundos)
      VALUES (${fk_maquina_id}, ${fk_tipo_cod_tipo}, ${tempo_estimado_segundos})
      ON CONFLICT (fk_maquina_id, fk_tipo_cod_tipo) DO UPDATE
      SET tempo_estimado_segundos = EXCLUDED.tempo_estimado_segundos
      RETURNING *
    `;
    return row;
  }

  async readConfigs(maquinaId) {
    return await this.db`
      SELECT c.*, t.nome as tipo_nome
      FROM lab_system.maquina_teste_config c
      JOIN lab_system.tipo t ON c.fk_tipo_cod_tipo = t.cod_tipo
      WHERE c.fk_maquina_id = ${maquinaId}
    `;
  }

  async readAllConfigs() {
    return await this.db`
      SELECT c.*, t.nome as tipo_nome, m.nome as maquina_nome
      FROM lab_system.maquina_teste_config c
      JOIN lab_system.tipo t ON c.fk_tipo_cod_tipo = t.cod_tipo
      JOIN lab_system.maquina m ON c.fk_maquina_id = m.id
      ORDER BY m.nome ASC, t.nome ASC
    `;
  }

  async deleteConfig(id) {
    await this.db`DELETE FROM lab_system.maquina_teste_config WHERE id = ${id}`;
  }

  // Performance Report
  async getMachinePerformance() {
    return await this.db`
      SELECT 
        m.nome as maquina,
        SUM(t.tempo_real_segundos)::int as tempo_total_segundos,
        COUNT(t.cod_teste)::int as total_testes,
        COUNT(t.cod_teste) FILTER (WHERE t.status = 'Aprovado')::int as aprovados,
        COUNT(t.cod_teste) FILTER (WHERE t.status = 'Reprovado')::int as reprovados
      FROM lab_system.maquina m
      LEFT JOIN lab_system.teste t ON t.fk_maquina_id = m.id
      GROUP BY m.id, m.nome
      ORDER BY tempo_total_segundos DESC
    `;
  }
}
