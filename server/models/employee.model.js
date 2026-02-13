import BaseModel from "./base.model.js";

export default class EmployeeModel extends BaseModel {
  constructor(db) {
    super(db);
  }

  async register(employeeData) {
    await this.#insertEmployee(employeeData);
    await this.#insertPhoneNumber(employeeData);
  }

  async #insertEmployee({ registration, shift, name, lastName, sector }) {
    try {
      await this.db`
        INSERT INTO lab_system.funcionario(matricula, turno, nome, sobrenome, fk_cod_setor) 
        VALUES (${registration}, ${shift}, ${name}, ${lastName}, ${sector || null})
      `;
    } catch (err) {
      if (err.message.includes("duplicate")) {
        throw new Error("Matrícula já existente.");
      }
      throw err;
    }
  }

  async #insertPhoneNumber({ registration, phoneNumber }) {
    if (!phoneNumber) return;
    await this.db`
      INSERT INTO lab_system.telefone(telefone, fk_funcionario_matricula) 
      VALUES (${phoneNumber}, ${registration})
    `;
  }

  async readAll() {
    const employees = await this.db`
      SELECT f.nome, f.sobrenome, f.matricula, f.turno, t.telefone, s.nome as setor, f.fk_cod_setor
      FROM lab_system.funcionario f 
      LEFT JOIN lab_system.telefone t ON t.fk_funcionario_matricula = f.matricula
      LEFT JOIN lab_system.setor s ON f.fk_cod_setor = s.id
    `;
    return employees;
  }

  async search(registration) {
    const employees = await this.db`
      SELECT f.nome, f.sobrenome, f.matricula, f.turno, t.telefone, s.nome as setor, f.fk_cod_setor
      FROM lab_system.funcionario f 
      LEFT JOIN lab_system.telefone t ON t.fk_funcionario_matricula = f.matricula
      LEFT JOIN lab_system.setor s ON f.fk_cod_setor = s.id
      WHERE f.matricula = ${registration}
    `;

    if (employees.length === 0) {
      throw new Error("Matrícula não encontrada.");
    }

    return employees[0];
  }

  async edit(employeeData) {
    await this.#updateEmployee(employeeData);
    await this.#updatePhoneNumber(employeeData);
  }

  async #updateEmployee({ registration, shift, name, lastName, sector }) {
    await this.db`
      UPDATE lab_system.funcionario
      SET turno = ${shift}, nome = ${name}, sobrenome = ${lastName}, fk_cod_setor = ${sector || null}
      WHERE matricula = ${registration}
    `;
  }

  async #updatePhoneNumber({ registration, phoneNumber }) {
    if (!phoneNumber) return;
    const existing = await this.db`SELECT 1 FROM lab_system.telefone WHERE fk_funcionario_matricula = ${registration}`;

    if (existing.length > 0) {
      await this.db`
        UPDATE lab_system.telefone
        SET telefone = ${phoneNumber}
        WHERE fk_funcionario_matricula = ${registration}
      `;
    } else {
      await this.#insertPhoneNumber({ registration, phoneNumber });
    }
  }

  async delete(registration) {
    await this.db`
      DELETE FROM lab_system.funcionario
      WHERE matricula = ${registration}
    `;
  }

  /**
   * Formata dados dos funcionários concatenando nome + sobrenome.
   */
  static formatFullName(employees) {
    return employees.map((e) => ({
      nome: `${e.nome} ${e.sobrenome}`,
      matricula: e.matricula,
      turno: e.turno,
      telefone: e.telefone,
      setor: e.setor,
      fk_cod_setor: e.fk_cod_setor
    }));
  }
}
