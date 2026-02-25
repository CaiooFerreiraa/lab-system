import BaseModel from "./base.model.js";

export default class SectorModel extends BaseModel {
  constructor(db) {
    super(db);
  }

  async register({ nome, config_perfil, sla_entrega_dias }) {
    try {
      const [res] = await this.db`
        INSERT INTO lab_system.setor(nome, config_perfil, sla_entrega_dias)
        VALUES (${nome}, ${config_perfil || 'padrao'}, ${sla_entrega_dias || 4})
        RETURNING *
      `;
      return res;
    } catch (error) {
      if (error.message.includes("duplicate") && error.message.includes("key")) {
        throw new Error(`Setor "${nome}" já está cadastrado.`);
      }
      throw error;
    }
  }

  async search(nome) {
    const setor = await this.db`
      SELECT id, nome, config_perfil, sla_entrega_dias
      FROM lab_system.setor
      WHERE nome = ${nome}
    `;
    if (setor.length === 0) return null;

    const slas = await this.db`
      SELECT material_tipo, dias_sla
      FROM lab_system.config_prazo
      WHERE fk_cod_setor = ${setor[0].id}
    `;

    return { ...setor[0], slas };
  }

  async searchMateriaisInSetor(nome) {
    const materiais = await this.db`
      SELECT a.nome as Setor, b.tipo as Tipo, b.referencia as "Referência"
      FROM lab_system.setor a
      JOIN lab_system.material b ON a.id = b.cod_setor
      WHERE a.nome = ${nome}
      ORDER BY b.referencia;
    `;
    return materiais;
  }

  async edit(oldName, { newName, config_perfil, sla_entrega_dias }) {
    await this.db`
      UPDATE lab_system.setor
      SET 
        nome = ${newName},
        config_perfil = ${config_perfil || 'padrao'},
        sla_entrega_dias = ${sla_entrega_dias || 4}
      WHERE nome = ${oldName}
    `;
  }

  async delete(nome) {
    await this.db`
      DELETE FROM lab_system.setor
      WHERE nome = ${nome};
    `;
  }

  async readAll() {
    // Uma única query usando LEFT JOIN + JSON_AGG para evitar N+1 queries
    const setores = await this.db`
      SELECT
        s.id,
        s.nome,
        s.config_perfil,
        s.sla_entrega_dias,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('material_tipo', cp.material_tipo, 'dias_sla', cp.dias_sla)
          ) FILTER (WHERE cp.id IS NOT NULL),
          '[]'
        ) AS slas
      FROM lab_system.setor s
      LEFT JOIN lab_system.config_prazo cp ON cp.fk_cod_setor = s.id
      GROUP BY s.id, s.nome, s.config_perfil, s.sla_entrega_dias
      ORDER BY s.nome ASC
    `;

    return setores;
  }

  async updateGranularSLAs(sectorId, slas) {
    // slas: [{ material_tipo: 'BN', dias_sla: 4 }, ...]
    for (const item of slas) {
      await this.db`
        INSERT INTO lab_system.config_prazo (fk_cod_setor, material_tipo, dias_sla)
        VALUES (${sectorId}, ${item.material_tipo}, ${item.dias_sla})
        ON CONFLICT (fk_cod_setor, material_tipo) 
        DO UPDATE SET dias_sla = EXCLUDED.dias_sla
      `;
    }
  }
}
