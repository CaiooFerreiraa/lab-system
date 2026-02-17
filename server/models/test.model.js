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
    const fk_funcionario_matricula = await this.#getFuncMatricula(shared.fk_funcionario_matricula);

    const laudo = await this.db`
      INSERT INTO lab_system.laudo (
        fk_funcionario_matricula,
        fk_modelo_cod_modelo,
        fk_material,
        fk_cod_setor,
        observacoes,
        codigo_laudo,
        numero_pedido
      ) VALUES (
        ${fk_funcionario_matricula},
        ${shared.fk_modelo_cod_modelo || null},
        ${shared.fk_material || null},
        ${shared.fk_cod_setor || null},
        ${shared.observacoes || null},
        ${codigoLaudo},
        ${shared.numero_pedido || null}
      )
      RETURNING id
    `;
    const laudoId = laudo[0].id;

    // 2.5 Se houver metadados de descolagem (Pré-Fabricado), salvar na tabela correspondente
    if (shared.metadata) {
      const m = shared.metadata;
      await this.db`
        INSERT INTO lab_system.descolagem (
          fk_laudo_id, requisitante, lider, coordenador, gerente, 
          esteira, adesivo, adesivo_fornecedor, lado, 
          data_realizacao, data_colagem, fk_modelo_cod_modelo,
          fk_funcionario_matricula, fk_cod_setor, prioridade
        ) VALUES (
          ${laudoId}, ${m.requisitante || null}, ${m.lider || null}, 
          ${m.coordenador || null}, ${m.gerente || null}, ${m.esteira || null}, 
          ${m.adesivo || null}, ${m.adesivo_fornecedor || null}, ${m.lado || 'Único'},
          ${m.data_realizacao || null}, ${m.data_colagem || null}, 
          ${shared.fk_modelo_cod_modelo || null}, ${shared.fk_funcionario_matricula || null}, 
          ${shared.fk_cod_setor || null}, ${m.prioridade || false}
        )
      `;
    }

    // 2. Registrar testes vinculados ao laudo
    const results = [];
    for (const t of testes) {
      const res = await this.register({ ...shared, ...t, fk_laudo_id: laudoId });
      results.push(res);
    }

    // 3. Status inicial sempre Pendente (conforme solicitado pelo usuário: FIFO e controle manual)
    await this.db`UPDATE lab_system.laudo SET status_geral = 'Pendente' WHERE id = ${laudoId}`;

    return {
      laudoId,
      total: testes.length,
      aprovados: results.filter(r => r.status === 'Aprovado').length,
      reprovados: results.filter(r => r.status === 'Reprovado').length,
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
        COALESCE(cp.dias_sla, s.sla_entrega_dias, 4) as setor_sla_dias,
        mat.tipo as tipo,
        ds.prioridade as peeling_priority,
        (SELECT COUNT(*) FROM lab_system.teste WHERE fk_laudo_id = l.id) as total_testes
      FROM lab_system.laudo l
      LEFT JOIN lab_system.funcionario f ON l.fk_funcionario_matricula = f.matricula
      LEFT JOIN lab_system.modelo m ON l.fk_modelo_cod_modelo = m.cod_modelo
      LEFT JOIN lab_system.setor s ON l.fk_cod_setor = s.id
      LEFT JOIN lab_system.material mat ON l.fk_material = mat.referencia
      LEFT JOIN lab_system.config_prazo cp ON (l.fk_cod_setor = cp.fk_cod_setor AND mat.tipo = cp.material_tipo)
      LEFT JOIN lab_system.descolagem ds ON ds.fk_laudo_id = l.id AND ds.lado = 'Único'
      ORDER BY 
        CASE l.status_geral
          WHEN 'Pendente' THEN 1
          WHEN 'Recebido' THEN 2
          WHEN 'Em Andamento' THEN 3
          ELSE 4
        END ASC,
        ds.prioridade DESC,
        l.data_criacao ASC
    `;
  }

  async getLaudo(id) {
    const laudos = await this.db`
      SELECT 
        l.*, 
        m.nome as modelo_nome, 
        f.nome || ' ' || f.sobrenome as func_nome, 
        s.nome as setor_nome,
        mat.tipo as material_tipo,
        COALESCE(cp.dias_sla, s.sla_entrega_dias, 4) as setor_sla_dias
      FROM lab_system.laudo l
      LEFT JOIN lab_system.modelo m ON l.fk_modelo_cod_modelo = m.cod_modelo
      LEFT JOIN lab_system.funcionario f ON l.fk_funcionario_matricula = f.matricula
      LEFT JOIN lab_system.setor s ON l.fk_cod_setor = s.id
      LEFT JOIN lab_system.material mat ON l.fk_material = mat.referencia
      LEFT JOIN lab_system.config_prazo cp ON (l.fk_cod_setor = cp.fk_cod_setor AND mat.tipo = cp.material_tipo)
      WHERE l.id = ${id}
    `;
    if (laudos.length === 0) return null;

    const testes = await this.db`
      SELECT t.*, tp.nome as tipo_nome 
      FROM lab_system.teste t
      JOIN lab_system.tipo tp ON t.fk_tipo_cod_tipo = tp.cod_tipo
      WHERE t.fk_laudo_id = ${id}
    `;

    const descolagem = await this.db`
      SELECT * FROM lab_system.descolagem WHERE fk_laudo_id = ${id}
    `;

    return { ...laudos[0], testes, descolagem };
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

    // O status do laudo permanece inalterado ou vai para 'Em Andamento' se for manual
    // Removida auto-avaliação automática para respeitar o controle do laboratório
  }

  /**
   * Marca o laudo como recebido pelo laboratório e inicia a contagem do SLA.
   */
  async markLaudoAsReceived(id, matricula) {
    // Busca informações do laudo, tipo do material e o SLA específico para essa combinação
    const laudo = await this.db`
      SELECT 
        l.*, 
        m.tipo as material_tipo,
        cp.dias_sla as granular_sla,
        s.sla_entrega_dias as fallback_sla
      FROM lab_system.laudo l
      LEFT JOIN lab_system.material m ON l.fk_material = m.referencia
      LEFT JOIN lab_system.setor s ON l.fk_cod_setor = s.id
      LEFT JOIN lab_system.config_prazo cp ON (l.fk_cod_setor = cp.fk_cod_setor AND m.tipo = cp.material_tipo)
      WHERE l.id = ${id}
    `;

    if (laudo.length === 0) throw new Error("Laudo não encontrado.");

    const l = laudo[0];
    // Prioridade: SLA Granular > SLA do Setor > 4 dias
    const slaDays = l.granular_sla || l.fallback_sla || 4;

    const dataRecebimento = new Date();
    const dataPrazo = this.#calculateDeadline(dataRecebimento, slaDays);

    await this.db`
      UPDATE lab_system.laudo 
      SET 
        data_recebimento = ${dataRecebimento},
        data_prazo = ${dataPrazo},
        status_geral = 'Recebido',
        fk_funcionario_matricula = ${matricula || l.fk_funcionario_matricula}
      WHERE id = ${id}
    `;

    return { dataRecebimento, dataPrazo };
  }

  /**
   * Calcula o prazo final considerando apenas dias úteis (Segunda a Sábado).
   */
  #calculateDeadline(startDate, days) {
    let date = new Date(startDate);
    let addedDays = 0;
    while (addedDays < days) {
      date.setDate(date.getDate() + 1);
      const day = date.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
      if (day !== 0) { // Segunda a Sábado são dias úteis
        addedDays++;
      }
    }
    return date;
  }

  async editLaudo(id, data) {
    if (data.fk_cod_setor !== undefined) {
      await this.db`
        UPDATE lab_system.laudo 
        SET fk_cod_setor = ${data.fk_cod_setor || null}
        WHERE id = ${id}
      `;

      // Atualizar o setor de todos os testes vinculados para manter consistência
      await this.db`
        UPDATE lab_system.teste
        SET fk_cod_setor = ${data.fk_cod_setor || null}
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

    if (data.status_geral !== undefined) {
      await this.db`
        UPDATE lab_system.laudo
        SET status_geral = ${data.status_geral}
        WHERE id = ${id}
      `;

      // Se o status for "Concluído", dispara a avaliação automática de todos os testes vinculados
      if (data.status_geral === 'Concluído') {
        const tests = await this.db`
          SELECT t.cod_teste, t.resultado, t.fk_modelo_cod_modelo, tp.nome as tipo_nome 
          FROM lab_system.teste t
          JOIN lab_system.tipo tp ON t.fk_tipo_cod_tipo = tp.cod_tipo
          WHERE t.fk_laudo_id = ${id}
        `;

        let laudoAprovado = true;
        for (const t of tests) {
          const evalRes = await this.#autoEvaluate(t.resultado, t.fk_modelo_cod_modelo, t.tipo_nome);
          const finalStatus = evalRes ? evalRes.status : 'Aprovado'; // Default to Aprovado if no spec
          if (finalStatus === 'Reprovado') laudoAprovado = false;

          await this.db`UPDATE lab_system.teste SET status = ${finalStatus} WHERE cod_teste = ${t.cod_teste}`;
        }

        await this.db`
          UPDATE lab_system.laudo 
          SET status_geral = ${laudoAprovado ? 'Aprovado' : 'Reprovado'} 
          WHERE id = ${id}
        `;
      }
      // Se o status for alterado para algo não-final, reseta o status dos testes para Pendente
      else if (['Pendente', 'Em Andamento'].includes(data.status_geral)) {
        await this.db`
          UPDATE lab_system.teste
          SET status = 'Pendente'
          WHERE fk_laudo_id = ${id}
        `;
      }
    }
  }

  async deleteLaudo(id) {
    // Neon transaction expects an array of queries
    return await this.db.transaction(tx => [
      tx`DELETE FROM lab_system.teste WHERE fk_laudo_id = ${id}`,
      tx`DELETE FROM lab_system.descolagem WHERE fk_laudo_id = ${id}`,
      tx`DELETE FROM lab_system.laudo WHERE id = ${id} RETURNING id`
    ]);
  }

  // ============================
  // TEST METHODS (INDIVIDUAL)
  // ============================

  async register(data) {
    const fk_tipo_cod_tipo = await this.#getTipoByNome(data.fk_tipo_cod_tipo);
    let fk_cod_setor = await this.#getSetorByNome(data.fk_cod_setor);

    // Fallback: Se não informado, busca o setor do funcionário logado
    if (!fk_cod_setor && data.fk_funcionario_matricula) {
      const funcionario = await this.db`SELECT fk_cod_setor FROM lab_system.funcionario WHERE matricula = ${data.fk_funcionario_matricula} LIMIT 1`;
      if (funcionario.length > 0) fk_cod_setor = funcionario[0].fk_cod_setor;
    }

    if (!fk_cod_setor) {
      throw new Error(`Setor inválido ou não informado para o registro de teste. (Matrícula: ${data.fk_funcionario_matricula})`);
    }

    const fk_material = await this.#getOrCreateMaterial(data.fk_material, fk_cod_setor, data.tipo);

    const evaluation = await this.#autoEvaluate(
      data.resultado,
      data.fk_modelo_cod_modelo,
      data.fk_tipo_cod_tipo
    );

    const finalStatus = evaluation?.status || data.status || "Pendente";
    const specId = evaluation?.specId || await this.#getAnySpecForModel(data.fk_modelo_cod_modelo);

    const fk_funcionario_matricula = await this.#getFuncMatricula(data.fk_funcionario_matricula);

    await this.db`
      INSERT INTO lab_system.teste(
        status, resultado, data_inicio, data_fim,
        fk_local_cod_local, fk_tipo_cod_tipo,
        fk_funcionario_matricula, fk_modelo_cod_modelo,
        fk_cod_espec, fk_cod_setor, fk_material, fk_laudo_id
      ) VALUES(
        ${finalStatus}, ${data.resultado}, ${new Date()}, ${data.data_fim || null},
        ${data.fk_local_cod_local || null}, ${fk_tipo_cod_tipo},
        ${fk_funcionario_matricula}, ${data.fk_modelo_cod_modelo},
        ${specId}, ${fk_cod_setor}, ${fk_material}, ${data.fk_laudo_id || null}
      )
    `;

    const typeRes = await this.db`SELECT nome FROM lab_system.tipo WHERE cod_tipo = ${fk_tipo_cod_tipo} `;
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
    const laudo = await this.db`SELECT status_geral FROM lab_system.laudo WHERE id = ${fk_laudo_id}`;
    const laudoStatus = laudo[0]?.status_geral;

    const typeRes = await this.db`SELECT nome FROM lab_system.tipo WHERE cod_tipo = ${fk_tipo_cod_tipo} `;
    const typeName = typeRes[0]?.nome;
    const evaluation = await this.#autoEvaluate(resultado, fk_modelo_cod_modelo, typeName);

    // Se o laudo não estiver em estado finalizado, o teste individual deve permanecer 'Pendente'
    const isFinalStatus = ['Concluído', 'Aprovado', 'Reprovado'].includes(laudoStatus);
    const finalStatus = isFinalStatus ? (evaluation?.status || status || "Pendente") : "Pendente";

    await this.db`
      UPDATE lab_system.teste
      SET resultado = ${resultado},
      status = ${finalStatus},
      data_fim = ${data_fim || (isFinalStatus ? new Date() : null)},
      fk_local_cod_local = ${fk_local_cod_local || null}
      WHERE cod_teste = ${cod_teste}
      `;
  }

  // Fallbacks e Helpers (Mantenha o #autoEvaluate e outros métodos privados)
  // ... (rest of the file remains similar but updated to support fk_laudo_id where needed)

  async #autoEvaluate(resultado, codModelo, tipoNome) {
    // ... (mesma implementação anterior)
    if (resultado == null || resultado === "") return null;
    const mscSpec = await this.db`
       SELECT e.* FROM lab_system.msc_especificacao e
       JOIN lab_system.modelo m ON m.fk_msc_id = e.fk_msc_id
       WHERE m.cod_modelo = ${codModelo} AND e.tipo_teste:: text = ${tipoNome}
       LIMIT 1
     `;
    const valor = parseFloat(resultado);
    if (mscSpec.length > 0) {
      const s = mscSpec[0];
      let aprovado = false;
      let rangeInfo = "";
      switch (s.regra_tipo) {
        case 'range': aprovado = valor >= parseFloat(s.v_min) && valor <= parseFloat(s.v_max); rangeInfo = `${s.v_min} a ${s.v_max} `; break;
        case 'max': aprovado = valor < parseFloat(s.v_max); rangeInfo = `< ${s.v_max} `; break;
        case 'min': aprovado = valor > parseFloat(s.v_min); rangeInfo = `> ${s.v_min} `; break;
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
  async #getFuncMatricula(matricula) {
    const result = await this.db`SELECT matricula FROM lab_system.funcionario WHERE matricula = ${matricula} LIMIT 1`;
    return result[0]?.matricula || null;
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

  async search(codTeste) {
    const result = await this.db`
      SELECT 
        t.*,
        tp.nome as tipo_nome,
        m.nome as modelo_nome,
        s.nome as setor_nome
      FROM lab_system.teste t
      JOIN lab_system.tipo tp ON t.fk_tipo_cod_tipo = tp.cod_tipo
      JOIN lab_system.modelo m ON t.fk_modelo_cod_modelo = m.cod_modelo
      LEFT JOIN lab_system.setor s ON t.fk_cod_setor = s.id
      WHERE t.cod_teste = ${codTeste}
    `;
    return result[0];
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
    // 1. Resumo Geral (Agora por Laudo)
    const summaryRes = await this.db`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status_geral = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE status_geral = 'Reprovado')::int as reprovados,
        COUNT(*) FILTER (WHERE status_geral = 'Pendente')::int as pendentes
      FROM lab_system.laudo
    `;

    // 2. Por Modelo (Por Laudo)
    const byModel = await this.db`
      SELECT
        mo.nome as modelo,
        ma.nome as marca,
        mo.tipo as tipo_modelo,
        COUNT(l.*)::int as total,
        COUNT(*) FILTER (WHERE l.status_geral = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE l.status_geral = 'Reprovado')::int as reprovados,
        ROUND((COUNT(*) FILTER (WHERE l.status_geral = 'Aprovado')::float / NULLIF(COUNT(*) FILTER (WHERE l.status_geral IN ('Aprovado', 'Reprovado')), 0) * 100)::numeric, 1) as taxa_aprovacao
      FROM lab_system.laudo l
      JOIN lab_system.modelo mo ON l.fk_modelo_cod_modelo = mo.cod_modelo
      JOIN lab_system.marca ma ON mo.cod_marca = ma.cod_marca
      GROUP BY mo.nome, ma.nome, mo.tipo
      ORDER BY total DESC
    `;

    // 3. Por Setor (Por Laudo)
    const bySector = await this.db`
      SELECT
        s.nome as setor,
        COUNT(l.*)::int as total,
        COUNT(*) FILTER (WHERE l.status_geral = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE l.status_geral = 'Reprovado')::int as reprovados,
        ROUND((COUNT(*) FILTER (WHERE l.status_geral = 'Aprovado')::float / NULLIF(COUNT(*) FILTER (WHERE l.status_geral IN ('Aprovado', 'Reprovado')), 0) * 100)::numeric, 1) as taxa_aprovacao
      FROM lab_system.laudo l
      JOIN lab_system.setor s ON l.fk_cod_setor = s.id
      GROUP BY s.nome
      `;

    // 4. Por Tipo de Teste
    const byType = await this.db`
    SELECT
    tp.nome as tipo,
      COUNT(*):: int as total,
        COUNT(*) FILTER(WHERE t.status = 'Aprovado'):: int as aprovados,
          COUNT(*) FILTER(WHERE t.status = 'Reprovado'):: int as reprovados,
            ROUND(AVG(NULLIF(t.resultado, 0)):: numeric, 2) as media_resultado,
            ROUND((COUNT(*) FILTER(WHERE t.status = 'Aprovado'):: float / NULLIF(COUNT(*) FILTER(WHERE t.status IN('Aprovado', 'Reprovado')), 0) * 100):: numeric, 1) as taxa_aprovacao
      FROM lab_system.teste t
      JOIN lab_system.tipo tp ON t.fk_tipo_cod_tipo = tp.cod_tipo
      GROUP BY tp.nome
      ORDER BY total DESC
      `;

    // 5. Por Marca
    const byBrand = await this.db`
    SELECT
    ma.nome as marca,
      COUNT(DISTINCT mo.cod_modelo):: int as modelos,
        COUNT(t.*):: int as total,
          COUNT(*) FILTER(WHERE t.status = 'Aprovado'):: int as aprovados,
            COUNT(*) FILTER(WHERE t.status = 'Reprovado'):: int as reprovados,
              ROUND((COUNT(*) FILTER(WHERE t.status = 'Aprovado'):: float / NULLIF(COUNT(*) FILTER(WHERE t.status IN('Aprovado', 'Reprovado')), 0) * 100):: numeric, 1) as taxa_aprovacao
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
