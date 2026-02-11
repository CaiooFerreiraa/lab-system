/**
 * Classe base para todos os repositórios do banco de dados.
 * Fornece interface padrão que todos os repositórios implementam.
 */
export default class BaseModel {
  constructor(db) {
    if (!db) throw new Error("Instância do banco é obrigatória.");
    this.db = db;
  }

  async register(_data) {
    throw new Error("Método register() não implementado.");
  }

  async search(_query) {
    throw new Error("Método search() não implementado.");
  }

  async edit(_data) {
    throw new Error("Método edit() não implementado.");
  }

  async delete(_query) {
    throw new Error("Método delete() não implementado.");
  }

  async readAll() {
    throw new Error("Método readAll() não implementado.");
  }
}
