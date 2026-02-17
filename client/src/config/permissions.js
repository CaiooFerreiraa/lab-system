/**
 * Configuração central de permissões por setor.
 *
 * Define quais tipos de material (BN/DN/Base) e quais tipos de teste
 * cada setor pode registrar e visualizar.
 *
 * - `allowedMaterialTypes`: quais tipos de material o setor pode cadastrar/ver.
 *     Se null ou ausente → pode todos.
 *
 * - `allowedTestTypes`: quais tipos de teste o setor pode registrar (pelo NOME do enum).
 *     Se null ou ausente → pode todos.
 *
 * - `sidebarGroups`: quais grupos da Sidebar o setor pode ver.
 *     Se null ou ausente → vê todos.
 *
 * O nome do setor é comparado em lowercase. Se o setor do usuário não estiver
 * listado aqui, ele terá acesso total (mesma lógica do admin).
 */

export const SECTOR_PERMISSIONS = {
  padrao: {
    label: "Acesso Padrão (Leitura)",
    allowedMaterialTypes: null,
    allowedTestTypes: [], // Não pode registrar nenhum teste por padrão
    sidebarGroups: ["main"],
    canEditTestResults: false,
  },
  "laboratório": {
    label: "Laboratório",
    allowedMaterialTypes: null,
    allowedTestTypes: null,
    sidebarGroups: null, // Vê tudo
    canEditTestResults: true,
  },
  // ... (rest remains same)
  borracha: {
    label: "Borracha",
    allowedMaterialTypes: ["BN"],
    allowedTestTypes: null,
    sidebarGroups: ["main", "engineering", "quality"], // Removido inventory
    canEditTestResults: false,
  },
  injetado: {
    label: "Injetado",
    allowedMaterialTypes: ["DN"],
    allowedTestTypes: null,
    sidebarGroups: ["main", "engineering", "quality"], // Removido inventory
    canEditTestResults: false,
  },
  "protótipo": {
    label: "Protótipo",
    allowedMaterialTypes: null, // Pode cadastrar qualquer tipo de MSC (BN, DN, Base)
    allowedTestTypes: null,
    sidebarGroups: ["main", "engineering", "quality"],
    canEditTestResults: false,
  },
  almoxarifado: {
    label: "Almoxarifado",
    allowedMaterialTypes: null,
    allowedTestTypes: null,
    sidebarGroups: ["main", "engineering", "quality"], // Removido inventory
    canEditTestResults: false,
  },
  "pré-fabricado": {
    label: "Pré-Fabricado",
    allowedMaterialTypes: null,
    allowedTestTypes: [
      "ENVELHECIMENTO",
      "ENCOLHIMENTO",
      "BLOOMING",
      "DESCOLAGEM",
      "HIDROLISE",
      "RESISTENCIA A LAVAGEM",
    ],
    sidebarGroups: ["main", "engineering", "quality", "peeling", "config"], // Removido inventory, adicionado peeling, adicionado config
    canEditTestResults: false,
  },
  "químico": {
    label: "Químico",
    allowedMaterialTypes: null,
    allowedTestTypes: null,
    sidebarGroups: ["main", "engineering", "quality"], // Removido inventory
    canEditTestResults: false,
  },
};

/**
 * Retorna as permissões do setor do usuário.
 * Se o setor não estiver mapeado, retorna permissões totais.
 */
export function getSectorPermissions(sectorName, role, profile) {
  // Admin tem acesso total
  if (role === "admin") {
    return {
      allowedMaterialTypes: null,
      allowedTestTypes: null,
      sidebarGroups: null,
      isRestricted: false,
      canEditTestResults: true,
    };
  }

  // Tenta buscar pelo perfil configurado (prioridade)
  if (profile) {
    const profileKey = profile.toLowerCase().trim();
    if (SECTOR_PERMISSIONS[profileKey]) {
      return { ...SECTOR_PERMISSIONS[profileKey], isRestricted: true };
    }
  }

  // Tenta buscar pelo nome do setor (compatibilidade legada)
  if (sectorName) {
    const nameKey = sectorName.toLowerCase().trim();
    if (SECTOR_PERMISSIONS[nameKey]) {
      return { ...SECTOR_PERMISSIONS[nameKey], isRestricted: true };
    }
  }

  // Se não encontrar nada, retorna perfil padrão (restrito)
  return { ...SECTOR_PERMISSIONS["padrao"], isRestricted: true };
}

/**
 * Filtra uma lista de tipos de material baseado nas permissões do setor.
 * @param {string[]} allTypes - Todos os tipos disponíveis (ex: ["BN", "DN", "Base"])
 * @param {string[]|null} allowedTypes - Tipos permitidos (null = todos)
 */
export function filterMaterialTypes(allTypes, allowedTypes) {
  if (!allowedTypes) return allTypes;
  return allTypes.filter((t) => allowedTypes.includes(t));
}

/**
 * Filtra uma lista de tipos de teste baseado nas permissões do setor.
 * @param {Array} testTypes - Lista de objetos { cod_tipo, nome }
 * @param {string[]|null} allowedTests - Nomes permitidos (null = todos)
 */
export function filterTestTypes(testTypes, allowedTests) {
  if (!allowedTests) return testTypes;
  return testTypes.filter((t) => allowedTests.includes(t.nome));
}

/**
 * Filtra a lista de materiais/produtos baseado no tipo permitido pelo setor.
 * @param {Array} materials - Lista de produtos com campo `tipo`
 * @param {string[]|null} allowedTypes - Tipos permitidos (null = todos)
 */
export function filterMaterials(materials, allowedTypes) {
  if (!allowedTypes) return materials;
  return materials.filter((m) => allowedTypes.includes(m.tipo));
}
