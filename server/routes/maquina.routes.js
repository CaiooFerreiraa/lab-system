import { Router } from "express";
import MaquinaController from "../controllers/maquina.controller.js";
import MaquinaModel from "../models/maquina.model.js";
import db from "../config/database.js";

const router = Router();
const repository = new MaquinaModel(db);
const controller = new MaquinaController(repository);

// Máquinas CRUD
router.get("/read", controller.readAll);
router.get("/search/:id", controller.search);
router.post("/register", controller.register);
router.put("/edit/:id", controller.edit);
router.delete("/delete/:id", controller.remove);

// Configurações de tempo
router.get("/config/all", controller.readAllConfigs);
router.get("/config/:maquinaId", controller.readConfigs);
router.post("/config", controller.registerConfig);
router.delete("/config/:id", controller.removeConfig);

// Dashboard
router.get("/performance", controller.getPerformance);

export default router;
