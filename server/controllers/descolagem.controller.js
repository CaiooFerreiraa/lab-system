import { asyncHandler } from "../middlewares/error-handler.js";
import { extractTextFromPDF, parseTechnicalData } from "../utils/pdf-extractor.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class DescolagemController {
  constructor(repository) {
    this.repository = repository;
  }

  upload = asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Nenhum arquivo enviado." });
    }

    const filePath = req.file.path;
    let extractedData = {};

    try {
      // Leitura automática do PDF
      const fullText = await extractTextFromPDF(filePath);
      extractedData = parseTechnicalData(fullText);
      console.log(`[PDF Extraction] Texto extraído de ${req.file.originalname}:`, fullText.substring(0, 500) + "...");
    } catch (err) {
      console.error("[PDF Extraction Error]", err);
    }

    // Tenta encontrar ou criar Marca, Modelo e Setor no banco
    const toInt = (val) => {
      if (!val || val === "null" || val === "") return null;
      const p = parseInt(val);
      return isNaN(p) ? null : p;
    };

    let fk_modelo = toInt(req.body.fk_modelo_cod_modelo);
    let fk_setor = toInt(req.body.fk_cod_setor);

    if (!fk_modelo && extractedData.modelo) {
      try {
        // 1. Garante que a Marca existe
        let cod_marca = null;
        if (extractedData.marca) {
          const [brand] = await this.repository.db`
            SELECT cod_marca FROM lab_system.marca WHERE nome ILIKE ${extractedData.marca} LIMIT 1
          `;
          if (brand) {
            cod_marca = brand.cod_marca;
          } else {
            const [newBrand] = await this.repository.db`
              INSERT INTO lab_system.marca (nome) VALUES (${extractedData.marca}) RETURNING cod_marca
            `;
            cod_marca = newBrand.cod_marca;
          }
        }

        // 2. Garante que o Modelo existe
        const [foundModel] = await this.repository.db`
          SELECT cod_modelo FROM lab_system.modelo 
          WHERE nome ILIKE ${'%' + extractedData.modelo + '%'} 
          OR ${extractedData.modelo} ILIKE '%' || nome || '%'
          LIMIT 1
        `;

        if (foundModel) {
          fk_modelo = foundModel.cod_modelo;
        } else {
          console.log(`[Auto-Create] Criando novo modelo: ${extractedData.modelo}`);
          const [newModel] = await this.repository.db`
            INSERT INTO lab_system.modelo (nome, cod_marca, tipo) 
            VALUES (${extractedData.modelo}, ${cod_marca}, 'Esportivo') 
            RETURNING cod_modelo
          `;
          fk_modelo = newModel.cod_modelo;
        }
      } catch (e) { console.error("Erro ao cruzar/criar modelo:", e); }
    }

    if (!fk_setor && (extractedData.esteira || extractedData.setor)) {
      const sectorName = extractedData.setor || extractedData.esteira;
      try {
        const [foundSector] = await this.repository.db`
          SELECT id FROM lab_system.setor 
          WHERE nome ILIKE ${'%' + sectorName + '%'}
          OR ${sectorName} ILIKE '%' || nome || '%'
          LIMIT 1
        `;

        if (foundSector) {
          fk_setor = foundSector.id;
        } else {
          console.log(`[Auto-Create] Criando novo setor: ${sectorName}`);
          const [newSector] = await this.repository.db`
            INSERT INTO lab_system.setor (nome) VALUES (${sectorName}) RETURNING id
          `;
          fk_setor = newSector.id;
        }
      } catch (e) { console.error("Erro ao cruzar/criar setor:", e); }
    }

    // Final Fallback: Se ainda não tem setor, usa o do usuário logado
    if (!fk_setor && req.user?.fk_cod_setor) {
      fk_setor = req.user.fk_cod_setor;
    }

    const data = {
      titulo: req.body.titulo || req.file.originalname,
      arquivo_nome: req.file.originalname,
      arquivo_path: `/uploads/${req.file.filename}`,
      fk_modelo_cod_modelo: fk_modelo,
      fk_cod_setor: fk_setor,
      fk_funcionario_matricula: req.body.fk_funcionario_matricula,
      lado: req.body.lado || 'Único',
      observacoes: req.body.observacoes,

      // Novos campos vindos do PDF ou Body
      marca: req.body.marca || extractedData.marca,
      requisitante: req.body.requisitante || extractedData.requisitante,
      lider: req.body.lider || extractedData.lider,
      coordenador: req.body.coordenador || extractedData.coordenador,
      gerente: req.body.gerente || extractedData.gerente,
      esteira: req.body.esteira || extractedData.esteira,
      adesivo: req.body.adesivo || extractedData.adesivo,
      adesivo_fornecedor: req.body.adesivo_fornecedor || extractedData.adesivo_fornecedor,
      data_realizacao: req.body.data_realizacao || extractedData.data_realizacao,
      data_colagem: req.body.data_colagem || extractedData.data_colagem,
      cores: req.body.cores || extractedData.cores,
      numero_pedido: req.body.numero_pedido || extractedData.numero_pedido,
      especificacao_valor: req.body.especificacao_valor || extractedData.especificacao_valor,
      realizado_por: req.body.realizado_por || extractedData.realizado_por,

      // Valores numéricos e status
      valor_media: (req.body.valor_media && req.body.valor_media !== "null") ? parseFloat(req.body.valor_media) : extractedData.vMedia,
      valor_minimo: (req.body.valor_minimo && req.body.valor_minimo !== "null") ? parseFloat(req.body.valor_minimo) : extractedData.vMin,
      valor_maximo: (req.body.valor_maximo && req.body.valor_maximo !== "null") ? parseFloat(req.body.valor_maximo) : extractedData.vMax,
      status_final: req.body.status_final || extractedData.statusFinal || 'Pendente'
    };

    // Se fk_laudo_id estiver presente, tentamos atualizar o laudo existente
    if (req.body.fk_laudo_id) {
      const laudoId = parseInt(req.body.fk_laudo_id);
      const lado = data.lado;

      const row = await this.repository.updateByLaudoId(laudoId, lado, data);

      // Atualiza também a tabela de testes vinculada a este laudo
      try {
        // Busca testes do laudo que sejam do tipo DESCOLAGEM
        const tests = await this.repository.db`
          SELECT t.cod_teste, tp.nome 
          FROM lab_system.teste t
          JOIN lab_system.tipo tp ON t.fk_tipo_cod_tipo = tp.cod_tipo
          WHERE t.fk_laudo_id = ${laudoId} AND tp.nome ILIKE '%DESCOLAGEM%'
        `;

        if (tests.length > 0) {
          // Se houver mais de um teste (ex: Esquerdo e Direito), tenta filtrar pelo lado
          let targetTest = tests[0];
          if (tests.length > 1 && lado !== 'Único') {
            const matched = tests.find(t => t.nome.toLowerCase().includes(lado.toLowerCase()));
            if (matched) targetTest = matched;
          }

          // Atualiza o resultado do teste
          await this.repository.db`
            UPDATE lab_system.teste 
            SET resultado = ${data.valor_media}, status = ${data.status_final}
            WHERE cod_teste = ${targetTest.cod_teste}
          `;
          console.log(`[Link] Teste ${targetTest.cod_teste} atualizado com resultado do PDF.`);
        }
      } catch (e) {
        console.error("Erro ao atualizar teste vinculado:", e);
      }

      return res.status(200).json({
        success: true,
        data: row,
        message: "PDF vinculado ao laudo com sucesso.",
        autoExtracted: !!(extractedData.vMedia || extractedData.vMin || extractedData.vMax)
      });
    }

    const row = await this.repository.register(data);
    res.status(201).json({
      success: true,
      data: row,
      autoExtracted: !!(extractedData.vMedia || extractedData.vMin || extractedData.vMax)
    });
  });

  readAll = asyncHandler(async (_req, res) => {
    const rows = await this.repository.readAll();
    res.json({ success: true, data: rows });
  });

  search = asyncHandler(async (req, res) => {
    const { id } = req.query;
    // Implementação básica de busca se necessário futuramente
    res.json({ success: true, message: "Funcionalidade em desenvolvimento", id });
  });

  getReport = asyncHandler(async (_req, res) => {
    const reportData = await this.repository.getReport();
    res.json({ success: true, data: reportData });
  });

  remove = asyncHandler(async (req, res) => {
    const { id } = req.query;
    await this.repository.delete(id);
    res.json({ success: true, message: "Registro removido." });
  });
}
