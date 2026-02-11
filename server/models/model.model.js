import BaseModel from "./base.model.js";

export default class ModelModel extends BaseModel {
  constructor(db) {
    super(db);
  }

  async register({ nome, tipo, marca, especificacoes }) {
    const cod_marca = await this.#getBrandId(marca);

    const [{ cod_modelo }] = await this.db`
      INSERT INTO lab_system.modelo (nome, tipo, cod_marca)
      VALUES (${nome}, ${tipo}, ${cod_marca})
      RETURNING cod_modelo;
    `;

    for (const esp of especificacoes) {
      await this.db`
        INSERT INTO lab_system.especificacao (cod_modelo, tipo, valor_especificacao, valor_variacao)
        VALUES (${cod_modelo}, ${esp.tipo}, ${esp.valor}, ${esp.variacao});
      `;
    }
  }

  async #getBrandId(marca) {
    const result = await this.db`
      SELECT cod_marca
      FROM lab_system.marca
      WHERE nome = ${marca};
    `;

    if (result.length === 0) {
      throw new Error(`Marca "${marca}" não encontrada.`);
    }

    return result[0].cod_marca;
  }

  async search(id) {
    const result = await this.db`
      SELECT
        m.cod_modelo,
        m.nome,
        m.tipo,
        ma.nome AS marca,
        e.tipo AS espec_tipo,
        e.valor_especificacao AS Valor,
        e.valor_variacao AS "Variação"
      FROM lab_system.modelo m
      JOIN lab_system.marca ma ON m.cod_marca = ma.cod_marca
      LEFT JOIN lab_system.especificacao e ON m.cod_modelo = e.cod_modelo
      WHERE m.nome = ${id};
    `;

    if (result.length === 0) return null;

    const modelo = {
      cod_modelo: result[0].cod_modelo,
      nome: result[0].nome,
      tipo: result[0].tipo,
      marca: result[0].marca,
      especificacoes: [],
    };

    for (const row of result) {
      if (row.espec_tipo) {
        modelo.especificacoes.push({
          tipo: row.espec_tipo,
          valor: row.valor,
          variacao: row["Variação"],
        });
      }
    }

    return modelo;
  }

  async edit({ cod_modelo, nome, tipo, marca, especificacoes }) {
    const cod_marca = await this.#getBrandId(marca);

    await this.db`
      UPDATE lab_system.modelo
      SET 
        nome = COALESCE(${nome}, nome),
        tipo = COALESCE(${tipo}, tipo),
        cod_marca = COALESCE(${cod_marca}, cod_marca)
      WHERE cod_modelo = ${cod_modelo};
    `;

    await this.db`
      DELETE FROM lab_system.especificacao
      WHERE cod_modelo = ${cod_modelo};
    `;

    for (const esp of especificacoes) {
      await this.db`
        INSERT INTO lab_system.especificacao (cod_modelo, tipo, valor_especificacao, valor_variacao)
        VALUES (${cod_modelo}, ${esp.tipo}, ${esp.valor}, ${esp.variacao});
      `;
    }
  }

  async #getCodModelFromName(name) {
    const result = await this.db`
      SELECT cod_modelo
      FROM lab_system.modelo
      WHERE nome = ${name}
    `;

    if (result.length === 0) {
      throw new Error(`Modelo "${name}" não encontrado.`);
    }

    return result[0].cod_modelo;
  }

  async delete({ nome }) {
    const id = await this.#getCodModelFromName(nome);
    await this.db`
      DELETE FROM lab_system.modelo
      WHERE cod_modelo = ${id};
    `;
  }

  async readAll() {
    const modelos = await this.db`
      SELECT 
        m.cod_modelo,
        m.nome,
        m.tipo,
        ma.nome AS marca,
        COALESCE(
          json_agg(
            json_build_object(
              'tipo', e.tipo,
              'valor', e.valor_especificacao,
              'variacao', e.valor_variacao
            )
          ) FILTER (WHERE e.cod_especificacao IS NOT NULL),
        '[]') AS especificacoes
      FROM lab_system.modelo AS m
      JOIN lab_system.marca AS ma ON m.cod_marca = ma.cod_marca
      LEFT JOIN lab_system.especificacao AS e ON m.cod_modelo = e.cod_modelo
      GROUP BY m.cod_modelo, m.nome, m.tipo, ma.nome
      ORDER BY m.nome;
    `;

    return modelos;
  }
}
