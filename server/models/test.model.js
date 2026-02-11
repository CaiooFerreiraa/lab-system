import BaseModel from "./base.model.js";

export default class TestModel extends BaseModel {
  constructor(db) {
    super(db);
  }

  /**
   * Registra um único teste com auto-avaliação baseada nas especificações do modelo.
   */
  async register(data) {
    const fk_tipo_cod_tipo = await this.#getTipoByNome(data.fk_tipo_cod_tipo);
    const fk_cod_setor = await this.#getSetorByNome(data.fk_cod_setor);
    const fk_material = await this.#getOrCreateMaterial(data.fk_material, fk_cod_setor, data.tipo);

    // Auto-avaliação: busca especificação do modelo para esse tipo de teste
    const evaluation = await this.#autoEvaluate(
      data.resultado,
      data.fk_modelo_cod_modelo,
      data.fk_tipo_cod_tipo
    );

    const finalStatus = evaluation?.status || data.status || "Pendente";
    const specId = evaluation?.specId || await this.#getAnySpecForModel(data.fk_modelo_cod_modelo);

    await this.db`
      INSERT INTO lab_system.teste (
        status, resultado, data_inicio, data_fim,
        fk_local_cod_local, fk_tipo_cod_tipo,
        fk_funcionario_matricula, fk_modelo_cod_modelo,
        fk_cod_espec, fk_cod_setor, fk_material
      ) VALUES (
        ${finalStatus}, ${data.resultado}, ${new Date()}, ${data.data_fim || null},
        ${data.fk_local_cod_local || null}, ${fk_tipo_cod_tipo},
        ${data.fk_funcionario_matricula}, ${data.fk_modelo_cod_modelo},
        ${specId}, ${fk_cod_setor}, ${fk_material}
      )
    `;

    return {
      tipo: data.fk_tipo_cod_tipo,
      resultado: parseFloat(data.resultado),
      status: finalStatus,
      autoAvaliado: evaluation !== null,
      especificacao: evaluation?.spec || null,
    };
  }

  /**
   * Registra múltiplos testes em lote.
   * Recebe campos compartilhados + array de testes individuais.
   */
  async registerBatch({ shared, testes }) {
    const results = [];

    for (const teste of testes) {
      const merged = { ...shared, ...teste };
      const result = await this.register(merged);
      results.push(result);
    }

    const aprovados = results.filter((r) => r.status === "Aprovado").length;
    const reprovados = results.filter((r) => r.status === "Reprovado").length;

    return {
      total: results.length,
      aprovados,
      reprovados,
      pendentes: results.length - aprovados - reprovados,
      detalhes: results,
    };
  }

  /**
   * Auto-avaliação: compara resultado com especificação (valor ± variação).
   * Retorna { status, specId, spec } se especificação existir, null caso contrário.
   */
  async #autoEvaluate(resultado, codModelo, tipoNome) {
    if (resultado == null || resultado === "") return null;

    const spec = await this.db`
      SELECT cod_especificacao, valor_especificacao, valor_variacao
      FROM lab_system.especificacao
      WHERE cod_modelo = ${codModelo}
        AND tipo::text = ${tipoNome}
      LIMIT 1
    `;

    if (spec.length === 0) return null;

    const { cod_especificacao, valor_especificacao, valor_variacao } = spec[0];
    const valor = parseFloat(resultado);
    const especVal = parseFloat(valor_especificacao);
    const variacaoVal = parseFloat(valor_variacao);
    const min = especVal - variacaoVal;
    const max = especVal + variacaoVal;
    const aprovado = valor >= min && valor <= max;

    return {
      status: aprovado ? "Aprovado" : "Reprovado",
      specId: cod_especificacao,
      spec: { valor: especVal, variacao: variacaoVal, min, max },
    };
  }

  async #getAnySpecForModel(codModelo) {
    const spec = await this.db`
      SELECT cod_especificacao
      FROM lab_system.especificacao
      WHERE cod_modelo = ${codModelo}
      LIMIT 1
    `;
    return spec.length > 0 ? spec[0].cod_especificacao : 82;
  }

  async #getTipoByNome(nomeTipo) {
    const result = await this.db`
      SELECT cod_tipo FROM lab_system.tipo WHERE nome::text = ${nomeTipo}
    `;
    if (result.length === 0) throw new Error(`Tipo "${nomeTipo}" não encontrado.`);
    return result[0].cod_tipo;
  }

  async #getSetorByNome(nomeSetor) {
    const result = await this.db`
      SELECT id FROM lab_system.setor WHERE nome = ${nomeSetor}
    `;
    if (result.length === 0) throw new Error(`Setor "${nomeSetor}" não encontrado.`);
    return result[0].id;
  }

  async #getOrCreateMaterial(material, cod_setor, tipo) {
    if (!material) return null;

    const existing = await this.db`
      SELECT referencia FROM lab_system.material WHERE referencia = ${material} LIMIT 1
    `;

    if (existing.length > 0) return existing[0].referencia;

    const inserted = await this.db`
      INSERT INTO lab_system.material (tipo, referencia, cod_setor)
      VALUES (${tipo}, ${material}, ${cod_setor})
      RETURNING referencia
    `;
    return inserted[0].referencia;
  }

  async search(cod_teste) {
    const teste = await this.db`
      SELECT * FROM lab_system.teste WHERE cod_teste = ${cod_teste}
    `;
    return teste;
  }

  async edit(data) {
    throw new Error("Edição de testes ainda não implementada.");
  }

  async delete(cod_teste) {
    await this.db`DELETE FROM lab_system.teste WHERE cod_teste = ${cod_teste}`;
  }

  /**
   * Listagem com JOINs para dados legíveis.
   */
  async readAll() {
    const testes = await this.db`
      SELECT
        t.cod_teste,
        t.status::text as status,
        t.resultado,
        t.data_inicio,
        t.data_fim,
        t.fk_material as material,
        tp.nome::text as tipo_teste,
        mo.nome as modelo,
        ma.nome as marca,
        s.nome as setor,
        f.nome || ' ' || f.sobrenome as funcionario
      FROM lab_system.teste t
      JOIN lab_system.tipo tp ON t.fk_tipo_cod_tipo = tp.cod_tipo
      JOIN lab_system.modelo mo ON t.fk_modelo_cod_modelo = mo.cod_modelo
      JOIN lab_system.marca ma ON mo.cod_marca = ma.cod_marca
      JOIN lab_system.setor s ON t.fk_cod_setor = s.id
      JOIN lab_system.funcionario f ON t.fk_funcionario_matricula = f.matricula
      ORDER BY t.data_inicio DESC
    `;
    return testes;
  }

  /**
   * Relatório completo para tomada de decisão.
   */
  async getReport() {
    const summary = await this.db`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status::text = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE status::text = 'Reprovado')::int as reprovados,
        COUNT(*) FILTER (WHERE status::text = 'Pendente')::int as pendentes,
        COUNT(*) FILTER (WHERE status::text = 'Em Andamento')::int as em_andamento,
        COUNT(*) FILTER (WHERE status::text = 'Concluído')::int as concluidos
      FROM lab_system.teste
    `;

    const byModel = await this.db`
      SELECT
        mo.nome as modelo,
        ma.nome as marca,
        mo.tipo::text as tipo_modelo,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE t.status::text = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE t.status::text = 'Reprovado')::int as reprovados,
        ROUND(
          (COUNT(*) FILTER (WHERE t.status::text = 'Aprovado')::numeric /
           NULLIF(COUNT(*) FILTER (WHERE t.status::text IN ('Aprovado','Reprovado')), 0)) * 100, 1
        ) as taxa_aprovacao
      FROM lab_system.teste t
      JOIN lab_system.modelo mo ON t.fk_modelo_cod_modelo = mo.cod_modelo
      JOIN lab_system.marca ma ON mo.cod_marca = ma.cod_marca
      GROUP BY mo.nome, ma.nome, mo.tipo
      ORDER BY total DESC
    `;

    const bySector = await this.db`
      SELECT
        s.nome as setor,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE t.status::text = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE t.status::text = 'Reprovado')::int as reprovados,
        ROUND(
          (COUNT(*) FILTER (WHERE t.status::text = 'Aprovado')::numeric /
           NULLIF(COUNT(*) FILTER (WHERE t.status::text IN ('Aprovado','Reprovado')), 0)) * 100, 1
        ) as taxa_aprovacao
      FROM lab_system.teste t
      JOIN lab_system.setor s ON t.fk_cod_setor = s.id
      GROUP BY s.nome
      ORDER BY total DESC
    `;

    const byType = await this.db`
      SELECT
        tp.nome::text as tipo,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE t.status::text = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE t.status::text = 'Reprovado')::int as reprovados,
        ROUND(AVG(t.resultado)::numeric, 2) as media_resultado,
        ROUND(
          (COUNT(*) FILTER (WHERE t.status::text = 'Aprovado')::numeric /
           NULLIF(COUNT(*) FILTER (WHERE t.status::text IN ('Aprovado','Reprovado')), 0)) * 100, 1
        ) as taxa_aprovacao
      FROM lab_system.teste t
      JOIN lab_system.tipo tp ON t.fk_tipo_cod_tipo = tp.cod_tipo
      GROUP BY tp.nome
      ORDER BY total DESC
    `;

    const recent = await this.db`
      SELECT
        t.cod_teste,
        t.status::text as status,
        t.resultado,
        t.data_inicio,
        t.data_fim,
        t.fk_material as material,
        tp.nome::text as tipo_teste,
        mo.nome as modelo,
        ma.nome as marca,
        s.nome as setor,
        f.nome || ' ' || f.sobrenome as funcionario,
        e.valor_especificacao as spec_valor,
        e.valor_variacao as spec_variacao
      FROM lab_system.teste t
      JOIN lab_system.tipo tp ON t.fk_tipo_cod_tipo = tp.cod_tipo
      JOIN lab_system.modelo mo ON t.fk_modelo_cod_modelo = mo.cod_modelo
      JOIN lab_system.marca ma ON mo.cod_marca = ma.cod_marca
      JOIN lab_system.setor s ON t.fk_cod_setor = s.id
      JOIN lab_system.funcionario f ON t.fk_funcionario_matricula = f.matricula
      LEFT JOIN lab_system.especificacao e ON t.fk_cod_espec = e.cod_especificacao
      ORDER BY t.data_inicio DESC
      LIMIT 50
    `;

    const byBrand = await this.db`
      SELECT
        ma.nome as marca,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE t.status::text = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE t.status::text = 'Reprovado')::int as reprovados,
        COUNT(DISTINCT mo.cod_modelo)::int as modelos,
        ROUND(
          (COUNT(*) FILTER (WHERE t.status::text = 'Aprovado')::numeric /
           NULLIF(COUNT(*) FILTER (WHERE t.status::text IN ('Aprovado','Reprovado')), 0)) * 100, 1
        ) as taxa_aprovacao
      FROM lab_system.teste t
      JOIN lab_system.modelo mo ON t.fk_modelo_cod_modelo = mo.cod_modelo
      JOIN lab_system.marca ma ON mo.cod_marca = ma.cod_marca
      GROUP BY ma.nome
      ORDER BY total DESC
    `;

    return { summary: summary[0], byModel, bySector, byType, byBrand, recent };
  }
}
