import BaseModel from "./base.model.js";

export default class UserModel extends BaseModel {
  constructor(db) {
    super(db);
  }

  async getEmployeeSector(matricula) {
    if (!matricula) return null;
    const result = await this.db`
      SELECT fk_cod_setor 
      FROM lab_system.funcionario 
      WHERE matricula = ${matricula}
    `;
    return result[0]?.fk_cod_setor || null;
  }

  async create({ email, senha, role = 'user', matricula = null, setor = null }) {
    try {
      const result = await this.db`
        INSERT INTO lab_system.usuario (email, senha, role, fk_funcionario_matricula, fk_cod_setor)
        VALUES (${email}, ${senha}, ${role}, ${matricula}, ${setor})
        RETURNING id, email, role, fk_cod_setor;
      `;
      return result[0];
    } catch (error) {
      if (error.message.includes("duplicate") && error.message.includes("key")) {
        throw new Error("Email já cadastrado.");
      }
      throw error;
    }
  }

  async findByEmail(email) {
    const result = await this.db`
      SELECT u.*, f.nome, f.sobrenome, s.nome as setor_nome, s.config_perfil
      FROM lab_system.usuario u
      LEFT JOIN lab_system.funcionario f ON u.fk_funcionario_matricula = f.matricula
      LEFT JOIN lab_system.setor s ON u.fk_cod_setor = s.id
      WHERE u.email = ${email}
    `;
    return result[0];
  }

  async findById(id) {
    const result = await this.db`
      SELECT u.id, u.email, u.role, u.fk_funcionario_matricula, u.fk_cod_setor, s.nome as setor_nome, s.config_perfil
      FROM lab_system.usuario u
      LEFT JOIN lab_system.setor s ON u.fk_cod_setor = s.id
      WHERE u.id = ${id}
    `;
    return result[0];
  }

  async findAll() {
    const result = await this.db`
      SELECT u.id, u.email, u.role, u.data_criacao, u.fk_cod_setor, u.fk_funcionario_matricula,
             f.nome, f.sobrenome,
             s.nome as setor_nome, s.config_perfil
      FROM lab_system.usuario u
      LEFT JOIN lab_system.funcionario f ON u.fk_funcionario_matricula = f.matricula
      LEFT JOIN lab_system.setor s ON u.fk_cod_setor = s.id
      ORDER BY u.data_criacao DESC
    `;
    return result;
  }

  async updateRole(id, role) {
    await this.db`
      UPDATE lab_system.usuario
      SET role = ${role}
      WHERE id = ${id}
    `;
  }

  async remove(id) {
    await this.db`
      DELETE FROM lab_system.usuario
      WHERE id = ${id}
    `;
  }
}
