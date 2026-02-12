const API_URL = import.meta.env.VITE_API_URL || "";

/**
 * Wrapper para fetch com tratamento de erros padronizado.
 */
async function request(url, options = {}) {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  };

  const response = await fetch(`${API_URL}${url}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro inesperado na requisição.");
  }

  return data;
}

// ============================
// Employee API
// ============================
export const employeeApi = {
  list: () => request("/employee/view"),
  getOne: (registration) => request(`/employee/resgater/${registration}`),
  register: (data) => request("/employee/register", { method: "POST", body: JSON.stringify(data) }),
  update: (data) => request("/employee/update", { method: "PUT", body: JSON.stringify(data) }),
  remove: (registration) => request(`/employee/delete/${registration}`, { method: "DELETE" }),
};

// ============================
// Mark API
// ============================
export const markApi = {
  list: () => request("/mark/view"),
  getOne: (name) => request(`/mark/update/${name}`),
  register: (data) => request("/mark/register", { method: "POST", body: JSON.stringify(data) }),
  update: (data) => request("/mark/updateMark", { method: "PUT", body: JSON.stringify(data) }),
  remove: (name) => request(`/mark/delete/${name}`, { method: "DELETE" }),
  removeMethod: (id) => request(`/mark/delete/method/${id}`, { method: "DELETE" }),
  listTypes: () => request("/mark/list"),
  listTypeShoes: () => request("/mark/listTypeShoes"),
};

// ============================
// Product API
// ============================
export const productApi = {
  list: () => request("/product/read"),
  search: (uuid) => request(`/product/search?uuid=${uuid}`),
  register: (data) => request("/product/register", { method: "POST", body: JSON.stringify(data) }),
  update: (q) => request(`/product/edit?uuid=${q.uuid}&newcode=${q.newcode}&newtipo=${q.newtipo}&newsector=${q.newsector}`, { method: "PUT" }),
  remove: (q) => request(`/product/delete?uuid=${q.uuid}&setor=${q.setor}`, { method: "DELETE" }),
};

// ============================
// Sector API
// ============================
export const sectorApi = {
  list: () => request("/sector/read"),
  search: (nome) => request(`/sector/search?nome=${nome}`),
  listMateriais: (uuid) => request(`/sector/list?uuid=${uuid}`),
  register: (data) => request("/sector/register", { method: "POST", body: JSON.stringify(data) }),
  update: (oldName, newName) => request(`/sector/edit?oldName=${oldName}&newName=${newName}`, { method: "PUT" }),
  remove: (nome) => request(`/sector/delete?nome=${nome}`, { method: "DELETE" }),
};

// ============================
// Model API
// ============================
export const modelApi = {
  list: () => request("/model/read"),
  search: (uuid) => request(`/model/search/${encodeURIComponent(uuid)}`),
  register: (data) => request("/model/register", { method: "POST", body: JSON.stringify(data) }),
  update: (data) => request("/model/edit", { method: "PUT", body: JSON.stringify(data) }),
  linkMSC: (data) => request("/model/link-msc", { method: "PUT", body: JSON.stringify(data) }),
  remove: (nome) => request(`/model/delete?nome=${encodeURIComponent(nome)}`, { method: "DELETE" }),
};

// ============================
// Test API
// ============================
export const testApi = {
  list: () => request("/test/read"),
  listLaudos: () => request("/test/read-laudos"),
  getLaudo: (id) => request(`/test/laudo/${id}`),
  updateLaudo: (id, data) => request(`/test/laudo/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  addTestToLaudo: (laudoId, data) => request(`/test/laudo/${laudoId}/add-test`, { method: "POST", body: JSON.stringify(data) }),
  search: (cod_teste) => request(`/test/search?cod_teste=${cod_teste}`),
  register: (data) => request("/test/register", { method: "POST", body: JSON.stringify(data) }),
  registerBatch: (data) => request("/test/register", { method: "POST", body: JSON.stringify(data) }),
  update: (data) => request("/test/edit", { method: "PUT", body: JSON.stringify(data) }),
  remove: (cod_teste) => request(`/test/delete?cod_teste=${cod_teste}`, { method: "DELETE" }),
  report: () => request("/test/report"),
};

// ... (descolagem e msc)

// ============================
// Balança API
// ============================
export const balancaApi = {
  list: () => request("/balanca/read"),
  getOne: (id) => request(`/balanca/search/${id}`),
  register: (data) => request("/balanca/register", { method: "POST", body: JSON.stringify(data) }),
  update: (data) => request("/balanca/edit", { method: "PUT", body: JSON.stringify(data) }),
  remove: (id) => request(`/balanca/delete/${id}`, { method: "DELETE" }),
};

// ============================
// Enum API
// ============================
export const enumApi = {
  statusList: () => request("/enum/status"),
  typesTest: () => request("/enum/typestest"),
};

// ============================
// File Upload helper
// ============================
async function uploadFile(url, formData) {
  const response = await fetch(`${API_URL}${url}`, {
    method: "POST",
    body: formData,
    // Sem Content-Type - browser seta automaticamente com boundary
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Erro no upload.");
  return data;
}

// ============================
// Descolagem API
// ============================
export const descolagemApi = {
  list: () => request("/descolagem/read"),
  search: (id) => request(`/descolagem/search?id=${id}`),
  upload: (formData) => uploadFile("/descolagem/upload", formData),
  report: () => request("/descolagem/report"),
  remove: (id) => request(`/descolagem/delete?id=${id}`, { method: "DELETE" }),
};

// ============================
// MSC API
// ============================
export const mscApi = {
  list: () => request("/msc/read"),
  getOne: (id) => request(`/msc/search/${id}`),
  register: (data) => request("/msc/register", { method: "POST", body: JSON.stringify(data) }),
  update: (data) => request("/msc/edit", { method: "PUT", body: JSON.stringify(data) }),
};
