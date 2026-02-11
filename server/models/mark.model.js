import BaseModel from "./base.model.js";

export default class MarkModel extends BaseModel {
  constructor(db) {
    super(db);
  }

  async register({ marca, metodos }) {
    const [{ cod_marca }] = await this.db`
      INSERT INTO lab_system.marca (nome)
      VALUES (${marca})
      RETURNING cod_marca 
    `;

    for (const metodo of metodos) {
      await this.#insertMethod(cod_marca, metodo);
    }
  }

  async #insertMethod(cod_marca, { name, description }) {
    await this.db`
      INSERT INTO lab_system.metodo (nome, descricao, cod_marca)
      VALUES (${name}, ${description}, ${cod_marca})
    `;
  }

  async readAll() {
    const marks = await this.db`
      SELECT a.nome as Marca, b.nome as Metodo, b.descricao as Descrição, b.cod_metodo
      FROM lab_system.marca a
      LEFT JOIN lab_system.metodo b ON a.cod_marca = b.cod_marca
    `;
    return marks;
  }

  async search(nome) {
    const marks = await this.db`
      SELECT a.nome as marca, b.nome as metodo, b.descricao as descrição, b.cod_metodo
      FROM lab_system.marca a
      LEFT JOIN lab_system.metodo b ON a.cod_marca = b.cod_marca
      WHERE a.nome = ${nome};
    `;
    return marks;
  }

  async edit({ marca, metodo = [] }) {
    const cod_marca = await this.#getCodMarca(marca);

    for (const m of metodo) {
      if (m.cod_metodo == null) {
        await this.#insertMethod(cod_marca, { name: m.nome, description: m.descricao });
      } else {
        await this.db`
          UPDATE lab_system.metodo
          SET nome = ${m.nome}, descricao = ${m.descricao}
          WHERE cod_marca = ${cod_marca} AND cod_metodo = ${m.cod_metodo};
        `;
      }
    }
  }

  async #getCodMarca(marca) {
    const result = await this.db`
      SELECT cod_marca
      FROM lab_system.marca
      WHERE nome = ${marca} 
    `;

    if (result.length === 0) {
      throw new Error("Nome da marca não encontrado.");
    }

    return result[0].cod_marca;
  }

  async delete(nome) {
    await this.db`
      DELETE FROM lab_system.marca
      WHERE nome = ${nome}
    `;
  }

  async deleteMethod(cod_metodo) {
    await this.db`
      DELETE FROM lab_system.metodo
      WHERE cod_metodo = ${cod_metodo}
    `;
  }

  async listTypeTest() {
    const methods = await this.db`
      SELECT enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'tipo_enum';
    `;
    return methods.map((m) => m.enumlabel);
  }

  async listTypeShoes() {
    const methods = await this.db`
      SELECT enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'modelo_tipo';
    `;
    return methods.map((m) => m.enumlabel);
  }

  /**
   * Agrupa marcas por nome e seus métodos para resposta ao frontend.
   */
  static formatMarks(marks) {
    return marks.reduce((acc, item) => {
      const existing = acc.find((el) => el.marca === item.marca);
      const metodoObj = {
        nome: item.metodo,
        descricao: item["descrição"],
        cod_metodo: item.cod_metodo,
      };

      if (existing) {
        existing.metodo.push(metodoObj);
      } else {
        acc.push({ marca: item.marca, metodo: [metodoObj] });
      }

      return acc;
    }, []);
  }

  /**
   * Filtra métodos vazios antes de salvar.
   */
  static filterMethods({ marca, metodo = [] }) {
    return {
      marca,
      metodo: metodo.filter((m) => m.nome !== ""),
    };
  }
}
