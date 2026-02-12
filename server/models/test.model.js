import BaseModel from "./base.model.js";

export default class TestModel extends BaseModel {
  constructor(db) {
    super(db);
  }

  // ============================
  // LAUDO METHODS (GROUPS)
  // ============================

  /**
   * Registra um laudo completo com múltiplos testes.
   */
  async registerLaudo({ shared, testes }) {
    // 1. Gerar Código Sequencial (ex: L-2024-001)
    const year = new Date().getFullYear();
    const last = await this.db`SELECT id FROM lab_system.laudo ORDER BY id DESC LIMIT 1`;
    const nextId = last.length > 0 ? last[0].id + 1 : 1;
    const codigoLaudo = `L-${year}-${String(nextId).padStart(4, '0')}`;

    // 2. Criar o Laudo
    const laudo = await this.db`
      INSERT INTO lab_system.laudo (
        fk_funcionario_matricula,
        fk_modelo_cod_modelo,
        fk_material,
        fk_cod_setor,
        observacoes,
        codigo_laudo
      ) VALUES (
        ${shared.fk_funcionario_matricula},
        ${shared.fk_modelo_cod_modelo},
        ${shared.fk_material},
        ${shared.fk_cod_setor},
        ${shared.observacoes || null},
        ${codigoLaudo}
      )
      RETURNING id
    `;
    const laudoId = laudo[0].id;

    // 2. Registrar testes vinculados ao laudo
    const results = [];
    for (const t of testes) {
      const res = await this.register({ ...shared, ...t, fk_laudo_id: laudoId });
      results.push(res);
    }

    // 3. Atualizar status geral do laudo
    const statusGeral = results.some(r => r.status === 'Reprovado') ? 'Reprovado' : 'Aprovado';
    await this.db`UPDATE lab_system.laudo SET status_geral = ${statusGeral} WHERE id = ${laudoId}`;

    const aprovados = results.filter(r => r.status === 'Aprovado').length;
    const reprovados = results.filter(r => r.status === 'Reprovado').length;

    return {
      laudoId,
      total: testes.length,
      aprovados,
      reprovados,
      detalhes: results
    };
  }

  async readAllLaudos() {
    return await this.db`
      SELECT 
        l.*,
        f.nome || ' ' || f.sobrenome as funcionario_nome,
        m.nome as modelo_nome,
        s.nome as setor_nome,
        (SELECT COUNT(*) FROM lab_system.teste WHERE fk_laudo_id = l.id) as total_testes
      FROM lab_system.laudo l
      JOIN lab_system.funcionario f ON l.fk_funcionario_matricula = f.matricula
      JOIN lab_system.modelo m ON l.fk_modelo_cod_modelo = m.cod_modelo
      JOIN lab_system.setor s ON l.fk_cod_setor = s.id
      ORDER BY l.data_criacao DESC
    `;
  }

  async getLaudo(id) {
    const laudos = await this.db`
      SELECT l.*, m.nome as modelo_nome, f.nome as func_nome
      FROM lab_system.laudo l
      JOIN lab_system.modelo m ON l.fk_modelo_cod_modelo = m.cod_modelo
      JOIN lab_system.funcionario f ON l.fk_funcionario_matricula = f.matricula
      WHERE l.id = ${id}
    `;
    if (laudos.length === 0) return null;

    const testes = await this.db`
      SELECT t.*, tp.nome as tipo_nome 
      FROM lab_system.teste t
      JOIN lab_system.tipo tp ON t.fk_tipo_cod_tipo = tp.cod_tipo
      WHERE t.fk_laudo_id = ${id}
    `;

    return { ...laudos[0], testes };
  }

  /**
   * Adiciona um novo teste a um laudo existente e reavalia o laudo.
   */
  async addTestToLaudo(laudoId, testData) {
    const laudo = await this.db`SELECT * FROM lab_system.laudo WHERE id = ${laudoId}`;
    if (laudo.length === 0) throw new Error("Laudo não encontrado.");
    const l = laudo[0];

    // Registra o novo teste herdando dados do laudo
    await this.register({
      ...testData,
      fk_funcionario_matricula: l.fk_funcionario_matricula,
      fk_modelo_cod_modelo: l.fk_modelo_cod_modelo,
      fk_material: l.fk_material,
      fk_cod_setor: l.fk_cod_setor,
      fk_laudo_id: laudoId
    });

    // Reavalia status do laudo
    const tests = await this.db`SELECT status::text FROM lab_system.teste WHERE fk_laudo_id = ${laudoId}`;
    const statusGeral = tests.some(t => t.status === 'Reprovado') ? 'Reprovado' : 'Aprovado';
    await this.db`UPDATE lab_system.laudo SET status_geral = ${statusGeral} WHERE id = ${laudoId}`;
  }

  async editLaudo(id, data) {
    if (data.fk_cod_setor) {
      await this.db`
        UPDATE lab_system.laudo 
        SET fk_cod_setor = ${data.fk_cod_setor}
        WHERE id = ${id}
      `;

      // Opcional: Atualizar o setor de todos os testes vinculados para manter consistência
      await this.db`
        UPDATE lab_system.teste
        SET fk_cod_setor = ${data.fk_cod_setor}
        WHERE fk_laudo_id = ${id}
      `;
    }

    if (data.observacoes !== undefined) {
      await this.db`
        UPDATE lab_system.laudo 
        SET observacoes = ${data.observacoes}
        WHERE id = ${id}
      `;
    }
  }

  // ============================
  // TEST METHODS (INDIVIDUAL)
  // ============================

  async register(data) {
    const fk_tipo_cod_tipo = await this.#getTipoByNome(data.fk_tipo_cod_tipo);
    const fk_cod_setor = await this.#getSetorByNome(data.fk_cod_setor);
    const fk_material = await this.#getOrCreateMaterial(data.fk_material, fk_cod_setor, data.tipo);

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
        fk_cod_espec, fk_cod_setor, fk_material, fk_laudo_id
      ) VALUES (
        ${finalStatus}, ${data.resultado}, ${new Date()}, ${data.data_fim || null},
        ${data.fk_local_cod_local || null}, ${fk_tipo_cod_tipo},
        ${data.fk_funcionario_matricula}, ${data.fk_modelo_cod_modelo},
        ${specId}, ${fk_cod_setor}, ${fk_material}, ${data.fk_laudo_id || null}
      )
    `;

    const typeRes = await this.db`SELECT nome FROM lab_system.tipo WHERE cod_tipo = ${fk_tipo_cod_tipo}`;
    const tipoNome = typeRes[0]?.nome || data.fk_tipo_cod_tipo;

    return {
      status: finalStatus,
      tipo: tipoNome,
      resultado: data.resultado
    };
  }

  async edit({ cod_teste, resultado, status, data_fim, fk_local_cod_local }) {
    const current = await this.db`
      SELECT fk_modelo_cod_modelo, fk_tipo_cod_tipo, fk_laudo_id FROM lab_system.teste WHERE cod_teste = ${cod_teste}
    `;
    if (current.length === 0) throw new Error("Teste não encontrado.");
    const { fk_modelo_cod_modelo, fk_tipo_cod_tipo, fk_laudo_id } = current[0];

    const typeRes = await this.db`SELECT nome FROM lab_system.tipo WHERE cod_tipo = ${fk_tipo_cod_tipo}`;
    const typeName = typeRes[0]?.nome;

    const evaluation = await this.#autoEvaluate(resultado, fk_modelo_cod_modelo, typeName);
    const finalStatus = evaluation?.status || status || "Pendente";

    await this.db`
      UPDATE lab_system.teste
      SET resultado = ${resultado},
          status = ${finalStatus},
          data_fim = ${data_fim || null},
          fk_local_cod_local = ${fk_local_cod_local || null}
      WHERE cod_teste = ${cod_teste}
    `;

    // Se pertence a um laudo, reavalia o status do laudo
    if (fk_laudo_id) {
      const tests = await this.db`SELECT status::text FROM lab_system.teste WHERE fk_laudo_id = ${fk_laudo_id}`;
      const statusGeral = tests.some(t => t.status === 'Reprovado') ? 'Reprovado' : 'Aprovado';
      await this.db`UPDATE lab_system.laudo SET status_geral = ${statusGeral} WHERE id = ${fk_laudo_id}`;
    }
  }

  // Fallbacks e Helpers (Mantenha o #autoEvaluate e outros métodos privados)
  // ... (rest of the file remains similar but updated to support fk_laudo_id where needed)

  async #autoEvaluate(resultado, codModelo, tipoNome) {
    // ... (mesma implementação anterior)
    if (resultado == null || resultado === "") return null;
    const mscSpec = await this.db`
       SELECT e.* FROM lab_system.msc_especificacao e
       JOIN lab_system.modelo m ON m.fk_msc_id = e.fk_msc_id
       WHERE m.cod_modelo = ${codModelo} AND e.tipo_teste::text = ${tipoNome}
       LIMIT 1
     `;
    const valor = parseFloat(resultado);
    if (mscSpec.length > 0) {
      const s = mscSpec[0];
      let aprovado = false;
      let rangeInfo = "";
      switch (s.regra_tipo) {
        case 'range': aprovado = valor >= parseFloat(s.v_min) && valor <= parseFloat(s.v_max); rangeInfo = `${s.v_min} a ${s.v_max}`; break;
        case 'max': aprovado = valor < parseFloat(s.v_max); rangeInfo = `< ${s.v_max}`; break;
        case 'min': aprovado = valor > parseFloat(s.v_min); rangeInfo = `> ${s.v_min}`; break;
        default:
          const target = parseFloat(s.v_alvo);
          const vari = parseFloat(s.v_variacao);
          aprovado = valor >= (target - vari) && valor <= (target + vari);
          rangeInfo = `${target} +/- ${vari}`;
      }
      return { status: aprovado ? "Aprovado" : "Reprovado", spec: { info: rangeInfo, aprovado } };
    }
    return null;
  }

  async #getTipoByNome(identifier) {
    const result = await this.db`SELECT cod_tipo FROM lab_system.tipo WHERE nome::text = ${identifier} OR cod_tipo::text = ${identifier}::text LIMIT 1`;
    return result[0]?.cod_tipo || null;
  }
  async #getSetorByNome(id) {
    const result = await this.db`SELECT id FROM lab_system.setor WHERE id::text = ${id}::text OR nome = ${id} LIMIT 1`;
    return result[0]?.id || null;
  }
  async #getOrCreateMaterial(material, cod_setor, tipo) {
    if (!material) return null;
    const existing = await this.db`SELECT referencia FROM lab_system.material WHERE referencia = ${material} LIMIT 1`;
    if (existing.length > 0) return existing[0].referencia;
    const inserted = await this.db`INSERT INTO lab_system.material (tipo, referencia, cod_setor) VALUES (${tipo}, ${material}, ${cod_setor}) RETURNING referencia`;
    return inserted[0].referencia;
  }
  async #getAnySpecForModel(codModelo) {
    const spec = await this.db`SELECT cod_especificacao FROM lab_system.especificacao WHERE cod_modelo = ${codModelo} LIMIT 1`;
    return spec[0]?.cod_especificacao || null;
  }

  async delete(cod_teste) {
    await this.db`DELETE FROM lab_system.teste WHERE cod_teste = ${cod_teste}`;
  }

  async readAll() {
    return await this.db`
      SELECT t.*, tp.nome as tipo_teste, mo.nome as modelo, ma.nome as marca, s.nome as setor, f.nome as funcionario
      FROM lab_system.teste t
      JOIN lab_system.tipo tp ON t.fk_tipo_cod_tipo = tp.cod_tipo
      JOIN lab_system.modelo mo ON t.fk_modelo_cod_modelo = mo.cod_modelo
      JOIN lab_system.marca ma ON mo.cod_marca = ma.cod_marca
      JOIN lab_system.setor s ON t.fk_cod_setor = s.id
      JOIN lab_system.funcionario f ON t.fk_funcionario_matricula = f.matricula
      ORDER BY t.data_inicio DESC
    `;
  }

  async getReport() {
    // 1. Resumo Geral
    const summaryRes = await this.db`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE status = 'Reprovado')::int as reprovados,
        COUNT(*) FILTER (WHERE status = 'Pendente')::int as pendentes
      FROM lab_system.teste
    `;

    // 2. Por Modelo
    const byModel = await this.db`
      SELECT
        mo.nome as modelo,
        ma.nome as marca,
        mo.tipo as tipo_modelo,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE t.status = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE t.status = 'Reprovado')::int as reprovados,
        ROUND((COUNT(*) FILTER (WHERE t.status = 'Aprovado')::float / NULLIF(COUNT(*) FILTER (WHERE t.status IN ('Aprovado', 'Reprovado')), 0) * 100)::numeric, 1) as taxa_aprovacao
      FROM lab_system.teste t
      JOIN lab_system.modelo mo ON t.fk_modelo_cod_modelo = mo.cod_modelo
      JOIN lab_system.marca ma ON mo.cod_marca = ma.cod_marca
      GROUP BY mo.nome, ma.nome, mo.tipo
      ORDER BY total DESC
    `;

    // 3. Por Setor
    const bySector = await this.db`
      SELECT
        s.nome as setor,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE t.status = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE t.status = 'Reprovado')::int as reprovados,
        ROUND((COUNT(*) FILTER (WHERE t.status = 'Aprovado')::float / NULLIF(COUNT(*) FILTER (WHERE t.status IN ('Aprovado', 'Reprovado')), 0) * 100)::numeric, 1) as taxa_aprovacao
      FROM lab_system.teste t
      JOIN lab_system.setor s ON t.fk_cod_setor = s.id
      GROUP BY s.nome
      ORDER BY total DESC
    `;

    // 4. Por Tipo de Teste
    const byType = await this.db`
      SELECT
        tp.nome as tipo,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE t.status = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE t.status = 'Reprovado')::int as reprovados,
        ROUND(AVG(NULLIF(t.resultado, 0))::numeric, 2) as media_resultado,
        ROUND((COUNT(*) FILTER (WHERE t.status = 'Aprovado')::float / NULLIF(COUNT(*) FILTER (WHERE t.status IN ('Aprovado', 'Reprovado')), 0) * 100)::numeric, 1) as taxa_aprovacao
      FROM lab_system.teste t
      JOIN lab_system.tipo tp ON t.fk_tipo_cod_tipo = tp.cod_tipo
      GROUP BY tp.nome
      ORDER BY total DESC
    `;

    // 5. Por Marca
    const byBrand = await this.db`
      SELECT
        ma.nome as marca,
        COUNT(DISTINCT mo.cod_modelo)::int as modelos,
        COUNT(t.*)::int as total,
        COUNT(*) FILTER (WHERE t.status = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE t.status = 'Reprovado')::int as reprovados,
        ROUND((COUNT(*) FILTER (WHERE t.status = 'Aprovado')::float / NULLIF(COUNT(*) FILTER (WHERE t.status IN ('Aprovado', 'Reprovado')), 0) * 100)::numeric, 1) as taxa_aprovacao
      FROM lab_system.teste t
      JOIN lab_system.modelo mo ON t.fk_modelo_cod_modelo = mo.cod_modelo
      JOIN lab_system.marca ma ON mo.cod_marca = ma.cod_marca
      GROUP BY ma.nome
      ORDER BY total DESC
    `;

    // 6. Testes Recentes
    const recent = await this.db`
      SELECT 
        t.cod_teste, t.data_inicio, t.resultado, t.status, t.fk_material as material,
        tp.nome as tipo_teste, mo.nome as modelo, f.nome as funcionario,
        e.valor_especificacao as spec_valor, e.valor_variacao as spec_variacao
      FROM lab_system.teste t
      JOIN lab_system.tipo tp ON t.fk_tipo_cod_tipo = tp.cod_tipo
      JOIN lab_system.modelo mo ON t.fk_modelo_cod_modelo = mo.cod_modelo
      JOIN lab_system.funcionario f ON t.fk_funcionario_matricula = f.matricula
      LEFT JOIN lab_system.especificacao e ON t.fk_cod_espec = e.cod_especificacao
      ORDER BY t.data_inicio DESC
      LIMIT 50
    `;

    return {
      summary: summaryRes[0],
      byModel,
      bySector,
      byType,
      byBrand,
      recent
    };
  }
}
