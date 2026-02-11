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
        COUNT(*) FILTER (WHERE status_final::text = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE status_final::text = 'Reprovado')::int as reprovados,
        ROUND((COUNT(*) FILTER (WHERE status_final::text = 'Aprovado')::numeric / NULLIF(COUNT(*), 0)) * 100, 1) as taxa_aprovacao
      FROM lab_system.descolagem
      WHERE lider IS NOT NULL
      GROUP BY lider
      ORDER BY total DESC
    `;

    const byCoordenador = await this.db`
      SELECT 
        coordenador,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status_final::text = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE status_final::text = 'Reprovado')::int as reprovados,
        ROUND((COUNT(*) FILTER (WHERE status_final::text = 'Aprovado')::numeric / NULLIF(COUNT(*), 0)) * 100, 1) as taxa_aprovacao
      FROM lab_system.descolagem
      WHERE coordenador IS NOT NULL
      GROUP BY coordenador
      ORDER BY total DESC
    `;

    const byEsteira = await this.db`
      SELECT 
        esteira,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status_final::text = 'Aprovado')::int as aprovados,
        COUNT(*) FILTER (WHERE status_final::text = 'Reprovado')::int as reprovados,
        ROUND((COUNT(*) FILTER (WHERE status_final::text = 'Aprovado')::numeric / NULLIF(COUNT(*), 0)) * 100, 1) as taxa_aprovacao
      FROM lab_system.descolagem
      WHERE esteira IS NOT NULL
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

  async edit() { throw new Error("Não implementado."); }
  async search() { throw new Error("Não implementado."); }
}
