import EmployeeModel from "../models/employee.model.js";
import { asyncHandler } from "../middlewares/error-handler.js";

export default class EmployeeController {
  constructor(repository) {
    this.repository = repository;
  }

  register = asyncHandler(async (req, res) => {
    await this.repository.register(req.body);
    res.status(201).json({ success: true, message: "Funcionário cadastrado com sucesso." });
  });

  readAll = asyncHandler(async (_req, res) => {
    const employees = await this.repository.readAll();
    const formatted = EmployeeModel.formatFullName(employees);
    res.json({ success: true, data: formatted });
  });

  getOne = asyncHandler(async (req, res) => {
    const { registration } = req.params;
    const employee = await this.repository.search(registration);
    res.json({ success: true, data: employee });
  });

  update = asyncHandler(async (req, res) => {
    await this.repository.edit(req.body);
    res.json({ success: true, message: "Funcionário atualizado com sucesso." });
  });

  remove = asyncHandler(async (req, res) => {
    const { registration } = req.params;
    await this.repository.delete(registration);
    res.json({ success: true, message: "Funcionário deletado com sucesso." });
  });
}
