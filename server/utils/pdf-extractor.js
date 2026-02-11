import fs from 'fs';
import { PDFParse } from 'pdf-parse';

export async function extractTextFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();
  return result.text;
}

export function parseTechnicalData(text) {
  const data = {
    vMedia: null, vMin: null, vMax: null, statusFinal: 'Pendente',
    marca: null, requisitante: null, lider: null, coordenador: null, gerente: null,
    esteira: null, setor: null, adesivo: null, adesivo_fornecedor: null,
    data_realizacao: null, data_colagem: null, cores: null,
    numero_pedido: null, especificacao_valor: null
  };

  // 1. Detecção de Marca (Nike tem prioridade no formato)
  const isNike = /shoe\s+name|po\s+no|factory\s+code|lab\s+number/i.test(text);

  // 2. Valores Numéricos e Status (Procurando primeiro por campos diretos)
  const mediaMatch = text.match(/(?:m[ée]dia|average|mean|result)[\s\-:]*([\d,.]+)/i);
  if (mediaMatch) data.vMedia = parseFloat(mediaMatch[1].replace(',', '.'));

  const minMatch = text.match(/(?:m[íi]nimo|minimum|min)[\s\-:]*([\d,.]+)/i);
  if (minMatch) data.vMin = parseFloat(minMatch[1].replace(',', '.'));

  const maxMatch = text.match(/(?:m[áa]ximo|maximum|max)[\s\-:]*([\d,.]+)/i);
  if (maxMatch) data.vMax = parseFloat(maxMatch[1].replace(',', '.'));

  // FALLBACK: Tabela de ensaios (Nike e outros que só tem os valores no meio da tabela)
  if (!data.vMedia || data.vMedia === 0) {
    const tableValues = [];
    const lines = text.split('\n');
    let inTableArea = false;

    lines.forEach(line => {
      // Gatilhos de tabela Nike (Bond Strength / Mode Load) ou Padrão (F Máx/Larg)
      if (/f\s*m[áa]x\/larg|int\s+f\s*m[áa]x|bond\s*str|bond\s*strength|peeling|ades[ãa]o|mode\s*load|load/i.test(line)) {
        inTableArea = true;
        return;
      }
      // Rodapé da tabela
      if (inTableArea && (/respons[áa]vel|notas|observa[çc]|revis[ãa]o/i.test(line))) {
        inTableArea = false;
      }

      if (inTableArea) {
        // Regex super flexível para pegar qualquer decimal (x.x, x,x, xx.xx)
        const matches = line.match(/\d{1,2}[\.,]\d{1,3}/g);
        if (matches) {
          for (const m of matches) {
            const val = parseFloat(m.replace(',', '.'));
            // Filtro dinâmico: No Nike a spec é 2.5. Pegamos o primeiro valor da linha que não seja 2.5
            // e que esteja em uma faixa de teste plausível (ex: entre 0.5 e 20)
            if (val > 0.5 && val < 20 && val !== 2.5 && val !== 2.50) {
              tableValues.push(val);
              if (isNike) break; // Para Nike, o resultado é sempre o primeiro valor após a identificação da peça
            }
          }
        }
      }
    });

    if (tableValues.length > 0) {
      data.vMin = Math.min(...tableValues);
      data.vMax = Math.max(...tableValues);
      data.vMedia = parseFloat((tableValues.reduce((a, b) => a + b, 0) / tableValues.length).toFixed(1));
    }
  }

  // Se mesmo assim não houver média, tenta pegar qualquer número perto de "N/mm" ou "kgf"
  if (!data.vMedia) {
    const kgfMatch = text.match(/([\d,.]+)\s*(?:n\/mm|kgf)/i);
    if (kgfMatch) data.vMedia = parseFloat(kgfMatch[1].replace(',', '.'));
  }

  // 2.2 Detecção de Status Final (Melhorada com Âncoras)
  const statusMatch = text.match(/(?:parecer\s+t[ée]cnico|evaluation|status\s+final|resultado)[\s\-:]*([\s\n]*(?:aprovado|pass|approved|reprovado|fail|rejected|reprovação))/i);

  if (statusMatch) {
    const statusText = statusMatch[1].toLowerCase();
    if (/aprovado|pass|approved/i.test(statusText)) {
      data.statusFinal = 'Aprovado';
    } else if (/reprovado|fail|rejected|reprovação/i.test(statusText)) {
      data.statusFinal = 'Reprovado';
    }
  } else {
    // Fallback caso não encontre a âncora, busca por palavras isoladas com limites de borda
    if (/\b(aprovado|pass|approved)\b/i.test(text)) data.statusFinal = 'Aprovado';
    else if (/\b(reprovado|fail|rejected|reprovação)\b/i.test(text)) data.statusFinal = 'Reprovado';
  }

  // 3. Metadados de Produção
  if (isNike) {
    data.marca = 'NIKE';
    data.especificacao_valor = '2.5';
    data.setor = 'PRÉ-FABRICADO';
  } else {
    data.marca = text.match(/(?:marca|brand)[\s:]*([^\n]+)/i)?.[1]?.trim() ||
      text.match(/descolagem\s+de\s+banda\s+lateral\s*\n\s*([^\n]+)/i)?.[1]?.trim();
  }

  data.modelo = text.match(/(?:modelo|model|estilo|shoe\s+name|refer[êe]ncia)[\s\-:|]*([^\n|/]+)/i)?.[1]?.trim();

  // Metadados de Gestão
  const submitByIndex = text.toLowerCase().indexOf('submit by');
  const metadataBlock = submitByIndex !== -1 ? text.substring(submitByIndex, submitByIndex + 600) : text;

  const findNikeField = (label, src) => {
    const regex = new RegExp(`\\b${label}\\b[\\s\-:]*([^\\/|\\n]+)`, 'i');
    return src.match(regex)?.[1]?.trim();
  };

  data.requisitante = findNikeField('(?:requisitante|customer|req)', metadataBlock) || findNikeField('(?:requisitante|customer|req)', text);
  data.coordenador = findNikeField('(?:coordenador|coordinator|coor)', metadataBlock) || findNikeField('(?:coordenador|coordinator|coor)', text);
  data.lider = findNikeField('(?:l[íi]der|encarregado|supervisor)', metadataBlock) || findNikeField('(?:l[íi]der|encarregado|supervisor)', text);
  data.gerente = findNikeField('(?:gerente|manager)', metadataBlock) || findNikeField('(?:gerente|manager)', text);

  if (data.requisitante) {
    data.requisitante = data.requisitante.replace(/^[-\s]+/, '').split(/\s+-\s+/)[0].trim();
  }

  data.esteira = text.match(/(?:esteira|linha|track|line)[\s\-:]*([^\n]+)/i)?.[1]?.trim();
  if (!data.setor) {
    data.setor = text.match(/(?:setor|department|dept|area)[\s\-:|]*([^\n]+)/i)?.[1]?.trim();
  }

  // Adesivo e Fornecedor (Melhoria na divisão por palavra-chave)
  const ccMatch = text.match(/CC\s+([^\n]+)/i);
  const adhesiveRaw = ccMatch ? ccMatch[1].trim() : text.match(/(?:adesivo|adhesive)[\s:]*([^\n]+)/i)?.[1]?.trim();

  if (adhesiveRaw) {
    const parts = adhesiveRaw.split(/\s*\/\s*/);
    let mainInfo = parts[0].trim();
    if (parts[1]) data.cores = parts[1].trim();

    // Limpeza de hífens solitários no final
    mainInfo = mainInfo.replace(/\s+-\s*$/, '');

    // Busca por palavra "fornecedor" ou "forn" ou hífen seguido de fornecedor
    const supplierRegex = /(.*?)\s*(?:fornecedor|supplier|forn)[:\s\-]+(.*)/i;
    const sMatch = mainInfo.match(supplierRegex);

    if (sMatch) {
      data.adesivo = sMatch[1].trim();
      data.adesivo_fornecedor = sMatch[2].trim();
    } else {
      // Tenta dividir por hífen
      const hiphenParts = mainInfo.split(/\s+-\s+/);
      if (hiphenParts.length >= 2) {
        data.adesivo = hiphenParts[0].trim();
        data.adesivo_fornecedor = hiphenParts[1].trim();
      } else {
        data.adesivo = mainInfo;
      }
    }
  }

  if (!data.adesivo_fornecedor) {
    data.adesivo_fornecedor = text.match(/(?:fornecedor[\s]adesivo|adesivo[\s]forn|supplier)[\s:]*([^\n]+)/i)?.[1]?.trim();
  }

  // Executor
  const testByMatch = text.match(/(?:test\s+by)[\s\-:]*([^\n]+)/i);
  const lines = text.split('\n').map(l => l.trim());
  const respTechIndex = lines.findIndex(l => /respons[áa]vel\s+t[ée]cnico/i.test(l));

  if (testByMatch) {
    data.realizado_por = testByMatch[1].trim();
  } else if (respTechIndex > 0) {
    data.realizado_por = lines[respTechIndex - 1];
  } else {
    data.realizado_por = text.match(/(?:realizado[\s]por|executor|tested[\s]by|t[ée]cnico|tech)[\s:]*([^\n]+)/i)?.[1]?.trim();
  }

  // Datas (Processamento e Normalização para YYYY-MM-DD)
  const formatDateForDB = (dateStr) => {
    if (!dateStr) return null;
    // Regex mais flexível para capturar D/M/YYYY ou DD/MM/YYYY
    const parts = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!parts) return null;

    const day = parts[1].padStart(2, '0');
    const month = parts[2].padStart(2, '0');
    const year = parts[3];

    return `${year}-${month}-${day}`;
  };

  const realizacaoMatch = text.match(/(?:data\s+do\s+teste|data\s+realiza[çc][ãa]o|completed\s+date|execution\s+date)[\s\-:]*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  const colagemMatch = text.match(/(?:data\s+da\s+colagem|data\s+colagem|manufactured\s+date|bonding\s+date)[\s\-:]*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  const dates = text.match(/\d{1,2}\/\d{1,2}\/\d{4}/g) || [];

  if (isNike) {
    // No Nike: 0:Manufactured, 1:Received, 2:Completed
    data.data_realizacao = formatDateForDB(realizacaoMatch?.[1] || (dates.length >= 3 ? dates[2] : dates[0]));
    data.data_colagem = formatDateForDB(colagemMatch?.[1] || dates[0]);
  } else {
    // Laudo Único: 0:Realização, 1:Colagem
    data.data_realizacao = formatDateForDB(realizacaoMatch?.[1] || dates[0]);
    data.data_colagem = formatDateForDB(colagemMatch?.[1] || dates[1]);
  }

  data.cores = data.cores || text.match(/(?:cores|coloração|colors|cor)[\s\-:]*([^\n]+)/i)?.[1]?.trim();
  const pedidoMatch = text.match(/(?:pedido|nbr|order|po\s+no)[\s\-:]*([^\n#]+)/i);
  if (pedidoMatch) {
    data.numero_pedido = pedidoMatch[1].split(/(?:especific|norma|m[íi]n|size|model|shoe)/i)[0].trim();
  }

  const specMatch = text.match(/(?:especifica[çc][ãa]o|specification|especific\.\s*m[íi]n)[\s\-:|]*([^\n|/]+)/i);
  if (specMatch && !data.especificacao_valor) {
    data.especificacao_valor = specMatch[1].replace(/(?:n\/mm|kgf.*)/i, '').trim();
  }

  // Limpeza final de ruídos
  const fieldsToClean = ['lider', 'gerente', 'esteira', 'setor', 'marca', 'requisitante', 'coordenador', 'realizado_por', 'adesivo', 'adesivo_fornecedor', 'cores', 'numero_pedido', 'modelo', 'especificacao_valor'];
  fieldsToClean.forEach(f => {
    if (data[f]) {
      data[f] = data[f].replace(/^[.\-\s:|/|]+/, '')
        .replace(/(?:requisi[çc][ãa]o|estilo|norma|especific|po\s+no|cc\s|modelo|model|estilo).*/i, '')
        .replace(/\.?\.is_ptf/gi, '')
        .trim()
        .replace(/^[.\-\s:|/|]+/, '')
        .replace(/[.\-\s:|/|]+$/, '');
      if (data[f] === '-' || data[f] === '--') data[f] = null;
    }
  });

  return data;
}
