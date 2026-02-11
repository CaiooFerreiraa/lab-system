import BaseModel from "./base.model.js";

export default class EmployeeModel extends BaseModel {
  constructor(db) {
    super(db);
  }

  async register(employeeData) {
    await this.#insertEmployee(employeeData);
    await this.#insertPhoneNumber(employeeData);
  }

  async #insertEmployee({ registration, shift, name, lastName }) {
    try {
      await this.db`
        INSERT INTO lab_system.funcionario(matricula, turno, nome, sobrenome) 
        VALUES (${registration}, ${shift}, ${name}, ${lastName})
      `;
    } catch (err) {
      throw new Error("Matrícula já existente.");
    }
  }

  async #insertPhoneNumber({ registration, phoneNumber }) {
    await this.db`
      INSERT INTO lab_system.telefone(telefone, fk_funcionario_matricula) 
      VALUES (${phoneNumber}, ${registration})
    `;
  }

  async readAll() {
    const employees = await this.db`
      SELECT nome, sobrenome, matricula, turno, telefone 
      FROM lab_system.funcionario f 
      JOIN lab_system.telefone t ON t.fk_funcionario_matricula = f.matricula
    `;
    return employees;
  }

  async search(registration) {
    const employees = await this.db`
      SELECT nome, sobrenome, matricula, turno, telefone 
      FROM lab_system.funcionario f 
      JOIN lab_system.telefone t ON t.fk_funcionario_matricula = f.matricula
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

  async #updateEmployee({ registration, shift, name, lastName }) {
    await this.db`
      UPDATE lab_system.funcionario
      SET turno = ${shift}, nome = ${name}, sobrenome = ${lastName}
      WHERE matricula = ${registration}
    `;
  }

  async #updatePhoneNumber({ registration, phoneNumber }) {
    await this.db`
      UPDATE lab_system.telefone
      SET telefone = ${phoneNumber}
      WHERE fk_funcionario_matricula = ${registration}
    `;
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
    }));
  }
}
