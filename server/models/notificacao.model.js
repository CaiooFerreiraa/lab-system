import BaseModel from "./base.model.js";

export default class NotificacaoModel extends BaseModel {
  constructor(db) {
    super(db);
  }

  async registerEmail({ email, tipo, nome_contato }) {
    const [row] = await this.db`
      INSERT INTO lab_system.email_notificacao (email, tipo, nome_contato)
      VALUES (${email}, ${tipo}, ${nome_contato || null})
      RETURNING *
    `;
    return row;
  }

  async readAllEmails() {
    return await this.db`SELECT * FROM lab_system.email_notificacao ORDER BY data_cadastro DESC`;
  }

  async deleteEmail(id) {
    await this.db`DELETE FROM lab_system.email_notificacao WHERE id = ${id}`;
  }

  async getEmailsByType(tipo) {
    return await this.db`SELECT email FROM lab_system.email_notificacao WHERE tipo = ${tipo}`;
  }
}
