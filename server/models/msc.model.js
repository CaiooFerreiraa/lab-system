import BaseModel from "./base.model.js";

export default class MSCModel extends BaseModel {
  constructor(db) {
    super(db);
  }

  async register({ nome, descricao, tipo, especificacoes }) {
    // 1. Criar a MSC (Cabeçalho)
    const [{ id }] = await this.db`
      INSERT INTO lab_system.msc (nome, descricao, tipo)
      VALUES (${nome}, ${descricao}, ${tipo || 'DN'})
      RETURNING id;
    `;

    // 2. Criar as Regras da MSC
    // especificacoes deve ser um array de { tipo_teste, regra_tipo, v_alvo, v_variacao, v_min, v_max }
    for (const esp of especificacoes) {
      await this.db`
        INSERT INTO lab_system.msc_especificacao (
          fk_msc_id, tipo_teste, regra_tipo, v_alvo, v_variacao, v_min, v_max
        ) VALUES (
          ${id}, ${esp.tipo_teste}, ${esp.regra_tipo || 'fixed'}, 
          ${esp.v_alvo || null}, ${esp.v_variacao || null}, 
          ${esp.v_min || null}, ${esp.v_max || null}
        );
      `;
    }
    return id;
  }

  async edit({ id, nome, descricao, tipo, especificacoes }) {
    return await this.db.begin(async sql => {
      // 1. Atualizar cabeçalho
      await sql`
        UPDATE lab_system.msc
        SET nome = ${nome}, descricao = ${descricao}, tipo = ${tipo}
        WHERE id = ${id}
      `;

      // 2. Remover especificações antigas
      await sql`DELETE FROM lab_system.msc_especificacao WHERE fk_msc_id = ${id}`;

      // 3. Inserir novas especificações
      for (const esp of especificacoes) {
        await sql`
          INSERT INTO lab_system.msc_especificacao (
            fk_msc_id, tipo_teste, regra_tipo, v_alvo, v_variacao, v_min, v_max
          ) VALUES (
            ${id}, ${esp.tipo_teste}, ${esp.regra_tipo || 'fixed'}, 
            ${esp.v_alvo || null}, ${esp.v_variacao || null}, 
            ${esp.v_min || null}, ${esp.v_max || null}
          );
        `;
      }
    });
  }

  async readAll() {
    return await this.db`
      SELECT id, nome, tipo, descricao, data_criacao
      FROM lab_system.msc
      ORDER BY nome ASC;
    `;
  }

  async search(id) {
    const result = await this.db`
      SELECT 
        m.id, m.nome, m.tipo, m.descricao,
        e.id as espec_id, e.tipo_teste, e.regra_tipo, e.v_alvo, e.v_variacao, e.v_min, e.v_max
      FROM lab_system.msc m
      LEFT JOIN lab_system.msc_especificacao e ON m.id = e.fk_msc_id
      WHERE m.id = ${id} OR m.nome = ${id};
    `;

    if (result.length === 0) return null;

    const msc = {
      id: result[0].id,
      nome: result[0].nome,
      tipo: result[0].tipo,
      descricao: result[0].descricao,
      especificacoes: []
    };

    result.forEach(row => {
      if (row.espec_id) {
        msc.especificacoes.push({
          id: row.espec_id,
          tipo_teste: row.tipo_teste,
          regra_tipo: row.regra_tipo,
          v_alvo: row.v_alvo,
          v_variacao: row.v_variacao,
          v_min: row.v_min,
          v_max: row.v_max
        });
      }
    });

    return msc;
  }
}
