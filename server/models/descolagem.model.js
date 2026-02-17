import BaseModel from "./base.model.js";

export default class DescolagemModel extends BaseModel {
  constructor(db) {
    super(db);
  }

  async register(data) {
    const {
      titulo, arquivo_nome, arquivo_path, fk_modelo_cod_modelo, fk_cod_setor,
      fk_funcionario_matricula, lado, observacoes, valor_media, valor_minimo,
      valor_maximo, status_final, marca, requisitante, lider, coordenador,
      gerente, esteira, adesivo, adesivo_fornecedor, data_realizacao,
      data_colagem, cores, numero_pedido, especificacao_valor, realizado_por
    } = data;

    const [row] = await this.db`
      INSERT INTO lab_system.descolagem (
        titulo, arquivo_nome, arquivo_path, fk_modelo_cod_modelo, fk_cod_setor, 
        fk_funcionario_matricula, lado, observacoes, valor_media, valor_minimo, 
        valor_maximo, status_final, marca, requisitante, lider, coordenador, 
        gerente, esteira, adesivo, adesivo_fornecedor, data_realizacao, 
        data_colagem, cores, numero_pedido, especificacao_valor, realizado_por
      )
      VALUES (
        ${titulo}, ${arquivo_nome}, ${arquivo_path}, ${fk_modelo_cod_modelo || null}, 
        ${fk_cod_setor || null}, ${fk_funcionario_matricula || null}, 
        ${lado || 'Único'}, ${observacoes || null}, ${valor_media || null}, 
        ${valor_minimo || null}, ${valor_maximo || null}, ${status_final || 'Pendente'},
        ${marca || null}, ${requisitante || null}, ${lider || null}, ${coordenador || null},
        ${gerente || null}, ${esteira || null}, ${adesivo || null}, ${adesivo_fornecedor || null},
        ${data_realizacao || null}, ${data_colagem || null}, ${cores || null},
        ${numero_pedido || null}, ${especificacao_valor || null}, ${realizado_por || null}
      )
      RETURNING *
    `;
    return row;
  }

  async readAll() {
    return await this.db`
      SELECT 
        d.*,
        m.nome as modelo_nome,
        s.nome as setor_nome,
        f.nome || ' ' || f.sobrenome as funcionario_nome
      FROM lab_system.descolagem d
      LEFT JOIN lab_system.modelo m ON d.fk_modelo_cod_modelo = m.cod_modelo
      LEFT JOIN lab_system.setor s ON d.fk_cod_setor = s.id
      LEFT JOIN lab_system.funcionario f ON d.fk_funcionario_matricula = f.matricula
      ORDER BY d.data_upload DESC
    `;
  }

  async delete(id) {
    const [row] = await this.db`
      DELETE FROM lab_system.descolagem WHERE id = ${id} RETURNING arquivo_path
    `;
    return row;
  }

  async getReport() {
    const summary = await this.db`
      SELECT 
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status_final::text = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE status_final::text = 'Reprovado')::int as reprovados,
        ROUND(AVG(valor_media)::numeric, 2) as media_geral
      FROM lab_system.descolagem
    `;

    const byLider = await this.db`
      SELECT 
        lider,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status_final = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE status_final = 'Reprovado')::int as reprovados,
        CASE 
          WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE status_final = 'Aprovado')::numeric / COUNT(*)::numeric) * 100, 1)
          ELSE 0 
        END as taxa_aprovacao
      FROM lab_system.descolagem
      WHERE lider IS NOT NULL AND lider <> ''
      GROUP BY lider
      ORDER BY total DESC
    `;

    const byCoordenador = await this.db`
      SELECT 
        coordenador,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status_final = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE status_final = 'Reprovado')::int as reprovados,
        CASE 
           WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE status_final = 'Aprovado')::numeric / COUNT(*)::numeric) * 100, 1)
           ELSE 0 
        END as taxa_aprovacao
      FROM lab_system.descolagem
      WHERE coordenador IS NOT NULL AND coordenador <> ''
      GROUP BY coordenador
      ORDER BY total DESC
    `;

    const byEsteira = await this.db`
      SELECT 
        esteira,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status_final = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE status_final = 'Reprovado')::int as reprovados,
        CASE 
           WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE status_final = 'Aprovado')::numeric / COUNT(*)::numeric) * 100, 1)
           ELSE 0 
        END as taxa_aprovacao
      FROM lab_system.descolagem
      WHERE esteira IS NOT NULL AND esteira <> ''
      GROUP BY esteira
      ORDER BY total DESC
    `;

    const byBrand = await this.db`
      SELECT 
        COALESCE(d.marca, ma.nome) as marca,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE d.status_final::text = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE d.status_final::text = 'Reprovado')::int as reprovados,
        ROUND(AVG(d.valor_media)::numeric, 2) as media_valor
      FROM lab_system.descolagem d
      LEFT JOIN lab_system.modelo mo ON d.fk_modelo_cod_modelo = mo.cod_modelo
      LEFT JOIN lab_system.marca ma ON mo.cod_marca = ma.cod_marca
      GROUP BY 1
      ORDER BY total DESC
    `;

    const byModel = await this.db`
      SELECT 
        COALESCE(mo.nome, 'Outros') as modelo,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE d.status_final::text = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE d.status_final::text = 'Reprovado')::int as reprovados
      FROM lab_system.descolagem d
      LEFT JOIN lab_system.modelo mo ON d.fk_modelo_cod_modelo = mo.cod_modelo
      GROUP BY mo.nome
      ORDER BY total DESC
    `;

    return {
      summary: summary[0],
      byLider,
      byCoordenador,
      byEsteira,
      byBrand,
      byModel
    };
  }

  async updateByLaudoId(laudoId, lado, data) {
    const {
      titulo, arquivo_nome, arquivo_path, valor_media, valor_minimo,
      valor_maximo, status_final, especificacao_valor
    } = data;

    // Tenta atualizar o registro existente para aquele lado no laudo
    const [row] = await this.db`
      UPDATE lab_system.descolagem SET
        titulo = COALESCE(${titulo}, titulo),
        arquivo_nome = COALESCE(${arquivo_nome}, arquivo_nome),
        arquivo_path = COALESCE(${arquivo_path}, arquivo_path),
        valor_media = COALESCE(${valor_media}, valor_media),
        valor_minimo = COALESCE(${valor_minimo}, valor_minimo),
        valor_maximo = COALESCE(${valor_maximo}, valor_maximo),
        status_final = COALESCE(${status_final}, status_final),
        especificacao_valor = COALESCE(${especificacao_valor}, especificacao_valor),
        data_upload = NOW()
      WHERE fk_laudo_id = ${laudoId} AND lado = ${lado}
      RETURNING *
    `;

    // Se não existir o registro para esse lado, cria um novo vinculado ao laudo
    // Mas geralmente registerLaudo já cria um. Se for Nike e for o segundo pé, pode precisar criar.
    if (!row) {
      // Pega metadados do primeiro registro deste laudo para manter consistência
      const [meta] = await this.db`SELECT * FROM lab_system.descolagem WHERE fk_laudo_id = ${laudoId} LIMIT 1`;

      const [newRow] = await this.db`
        INSERT INTO lab_system.descolagem (
          fk_laudo_id, titulo, arquivo_nome, arquivo_path, valor_media, valor_minimo,
          valor_maximo, status_final, lado, especificacao_valor,
          fk_modelo_cod_modelo, fk_cod_setor, fk_funcionario_matricula,
          marca, requisitante, lider, coordenador, gerente, esteira, 
          adesivo, adesivo_fornecedor, data_realizacao, data_colagem, cores, numero_pedido
        ) VALUES (
          ${laudoId}, ${titulo}, ${arquivo_nome}, ${arquivo_path}, ${valor_media}, ${valor_minimo},
          ${valor_maximo}, ${status_final}, ${lado}, ${especificacao_valor},
          ${meta?.fk_modelo_cod_modelo || data.fk_modelo_cod_modelo || null}, 
          ${meta?.fk_cod_setor || data.fk_cod_setor || null}, 
          ${meta?.fk_funcionario_matricula || data.fk_funcionario_matricula || null},
          ${meta?.marca || data.marca || null}, 
          ${meta?.requisitante || data.requisitante || null}, 
          ${meta?.lider || data.lider || null}, 
          ${meta?.coordenador || data.coordenador || null}, 
          ${meta?.gerente || data.gerente || null}, 
          ${meta?.esteira || data.esteira || null},
          ${meta?.adesivo || data.adesivo || null}, 
          ${meta?.adesivo_fornecedor || data.adesivo_fornecedor || null},
          ${meta?.data_realizacao || data.data_realizacao || null}, 
          ${meta?.data_colagem || data.data_colagem || null}, 
          ${meta?.cores || data.cores || null}, 
          ${meta?.numero_pedido || data.numero_pedido || null}
        )
        RETURNING *
      `;
      return newRow;
    }

    return row;
  }

  async edit() { throw new Error("Não implementado."); }
  async search() { throw new Error("Não implementado."); }
}
