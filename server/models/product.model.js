import BaseModel from "./base.model.js";

export default class ProductModel extends BaseModel {
  constructor(db) {
    super(db);
  }

  async register({ referencia, tipo, setor }) {
    try {
      const cod_setor = await this.#getSectorId(setor);
      await this.db`
        INSERT INTO lab_system.material (referencia, tipo, cod_setor)
        VALUES (${referencia}, ${tipo}, ${cod_setor})
      `;
    } catch (error) {
      if (error.message.includes("duplicate") && error.message.includes("key")) {
        throw new Error(`Código ${referencia} já está cadastrado.`);
      }
      throw error;
    }
  }

  async #getSectorId(setor) {
    if (!setor) throw new Error("Setor não informado.");

    const result = await this.db`
      SELECT id
      FROM lab_system.setor
      WHERE nome = ${setor} OR id::text = ${setor}::text;
    `;

    if (result.length === 0) {
      throw new Error(`Setor "${setor}" não encontrado.`);
    }

    return result[0].id;
  }

  async search(referencia) {
    const material = await this.db`
      SELECT a.referencia, a.tipo, b.nome as setor
      FROM lab_system.material a
      JOIN lab_system.setor b ON a.cod_setor = b.id
      WHERE a.referencia = ${referencia};
    `;
    return material;
  }

  async edit({ uuid, newcode, newsector, newtipo }) {
    const cod_setor = await this.#getSectorId(newsector);
    await this.db`
      UPDATE lab_system.material
      SET referencia = ${newcode}, cod_setor = ${cod_setor}, tipo = ${newtipo}
      WHERE referencia = ${uuid}
    `;
  }

  async delete({ uuid, setor }) {
    const cod_setor = await this.#getSectorId(setor);
    await this.db`
      DELETE FROM lab_system.material
      WHERE referencia = ${uuid} AND cod_setor = ${cod_setor}
    `;
  }

  async readAll() {
    const materiais = await this.db`
      SELECT a.referencia, a.tipo, a.cod_setor, b.nome as setor
      FROM lab_system.material a
      JOIN lab_system.setor b ON a.cod_setor = b.id;
    `;
    return materiais;
  }

  async list() {
    const materiais = await this.db`
      SELECT a.referencia, a.tipo, a.cod_setor, b.nome as setor
      FROM lab_system.material a
      JOIN lab_system.setor b ON a.cod_setor = b.id;
    `;
    return materiais;
  }
}
