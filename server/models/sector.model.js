import BaseModel from "./base.model.js";

export default class SectorModel extends BaseModel {
  constructor(db) {
    super(db);
  }

  async register({ nome, config_perfil }) {
    try {
      await this.db`
        INSERT INTO lab_system.setor(nome, config_perfil)
        VALUES (${nome}, ${config_perfil || 'padrao'})
      `;
    } catch (error) {
      if (error.message.includes("duplicate") && error.message.includes("key")) {
        throw new Error(`Setor "${nome}" já está cadastrado.`);
      }
      throw error;
    }
  }

  async search(nome) {
    const setor = await this.db`
      SELECT id, nome, config_perfil
      FROM lab_system.setor
      WHERE nome = ${nome}
    `;
    return setor;
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

  async edit(oldName, newName, config_perfil) {
    await this.db`
      UPDATE lab_system.setor
      SET 
        nome = ${newName},
        config_perfil = ${config_perfil || 'padrao'}
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
    const setores = await this.db`
      SELECT id, nome, config_perfil
      FROM lab_system.setor
      ORDER BY nome ASC;
    `;
    return setores;
  }
}
