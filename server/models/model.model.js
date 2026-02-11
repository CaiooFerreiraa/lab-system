import BaseModel from "./base.model.js";

export default class ModelModel extends BaseModel {
  constructor(db) {
    super(db);
  }

  async register({ nome, tipo, marca, fk_msc_id, especificacoes }) {
    const cod_marca = await this.#getBrandId(marca);

    const [{ cod_modelo }] = await this.db`
      INSERT INTO lab_system.modelo (nome, tipo, cod_marca, fk_msc_id)
      VALUES (${nome}, ${tipo}, ${cod_marca}, ${fk_msc_id || null})
      RETURNING cod_modelo;
    `;

    if (especificacoes && especificacoes.length > 0) {
      for (const esp of especificacoes) {
        if (!esp.tipo || (!esp.valor && !esp.variacao)) continue;
        await this.db`
          INSERT INTO lab_system.especificacao (cod_modelo, tipo, valor_especificacao, valor_variacao)
          VALUES (${cod_modelo}, ${esp.tipo}, ${esp.valor}, ${esp.variacao});
        `;
      }
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
    // Busca o modelo e verifica se tem MSC
    const modelBase = await this.db`
      SELECT m.*, ma.nome as marca_nome, msc.nome as msc_nome
      FROM lab_system.modelo m
      JOIN lab_system.marca ma ON m.cod_marca = ma.cod_marca
      LEFT JOIN lab_system.msc msc ON m.fk_msc_id = msc.id
      WHERE m.cod_modelo::text = ${id}::text OR m.nome = ${id}
      LIMIT 1
    `;

    if (modelBase.length === 0) return null;
    const m = modelBase[0];

    const modelo = {
      cod_modelo: m.cod_modelo,
      nome: m.nome,
      tipo: m.tipo,
      marca: m.marca_nome,
      fk_msc_id: m.fk_msc_id,
      msc_nome: m.msc_nome, // <--- Adicionado
      especificacoes: [],
    };

    if (m.fk_msc_id) {
      // Busca especificações da MSC
      const specs = await this.db`
        SELECT * FROM lab_system.msc_especificacao WHERE fk_msc_id = ${m.fk_msc_id}
      `;
      modelo.especificacoes = specs.map(s => ({
        tipo: s.tipo_teste,
        regra_tipo: s.regra_tipo,
        v_alvo: s.v_alvo,
        v_variacao: s.v_variacao,
        v_min: s.v_min,
        v_max: s.v_max,
        label: s.regra_tipo === 'range' ? `${s.v_min} a ${s.v_max}` :
          s.regra_tipo === 'max' ? `< ${s.v_max}` :
            s.regra_tipo === 'min' ? `> ${s.v_min}` :
              `${s.v_alvo} +/- ${s.v_variacao}`
      }));
    } else {
      // Busca especificações manuais (Legado)
      const specs = await this.db`
        SELECT tipo, valor_especificacao as valor, valor_variacao as variacao
        FROM lab_system.especificacao
        WHERE cod_modelo = ${m.cod_modelo}
      `;
      modelo.especificacoes = specs.map(s => ({
        tipo: s.tipo,
        regra_tipo: 'fixed',
        v_alvo: s.valor,
        v_variacao: s.variacao,
        label: `${s.valor} +/- ${s.variacao}`
      }));
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
        ms.nome AS msc_nome,
        m.fk_msc_id,
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
      LEFT JOIN lab_system.msc AS ms ON m.fk_msc_id = ms.id
      LEFT JOIN lab_system.especificacao AS e ON m.cod_modelo = e.cod_modelo
      GROUP BY m.cod_modelo, m.nome, m.tipo, ma.nome, ms.nome
      ORDER BY m.nome;
    `;

    return modelos;
  }
}
