import { Router } from "express";
import EmployeeController from "../controllers/employee.controller.js";
import EmployeeModel from "../models/employee.model.js";
import { validateEmployee } from "../middlewares/validators/employee.validator.js";
import db from "../config/database.js";

const router = Router();
const repository = new EmployeeModel(db);
const controller = new EmployeeController(repository);

router.post("/register", validateEmployee, controller.register);
router.get("/view", controller.readAll);
router.get("/resgater/:registration", controller.getOne);
router.put("/update", validateEmployee, controller.update);
router.delete("/delete/:registration", controller.remove);

export default router;
